"use client";

import { useState } from "react";
import {
  TAX_MODE_LABELS,
  calculateTotals,
  formatWon,
  type TaxMode,
} from "@/lib/calc";
import type { Preset } from "@/lib/preset/types";

// 작성 화면의 뼈대. 품목 표와 합계 계산만 동작한다.
// TODO(4단계): 거래처·조건 입력란, 미리보기, 저장(POST /api/documents), 임시 보관을 붙인다.

interface Row {
  id: number;
  name: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
}

function toNumber(value: string): number {
  const n = Number(value.replaceAll(",", ""));
  return Number.isFinite(n) ? n : 0;
}

export default function DocumentEditor({ preset }: { preset: Preset }) {
  const unitOptions = preset.columns.find((c) => c.key === "unit")?.options ?? [
    "식",
  ];

  const emptyRow = (id: number): Row => ({
    id,
    name: "",
    description: "",
    quantity: "1",
    unit: unitOptions[0],
    unitPrice: "",
  });

  const [rows, setRows] = useState<Row[]>([emptyRow(1)]);
  const [nextId, setNextId] = useState(2);
  const [taxMode, setTaxMode] = useState<TaxMode>(preset.defaultTaxMode);
  const [discount, setDiscount] = useState("");

  const totals = calculateTotals(
    rows.map((r) => ({
      quantity: toNumber(r.quantity),
      unitPrice: toNumber(r.unitPrice),
    })),
    toNumber(discount),
    taxMode,
  );

  const update = (id: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addRow = () => {
    setRows((prev) => [...prev, emptyRow(nextId)]);
    setNextId((n) => n + 1);
  };

  const removeRow = (id: number) =>
    setRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r.id !== id) : prev,
    );

  const input =
    "w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none";

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">새 견적서</h1>
      <p className="mt-1 text-sm text-slate-500">{preset.name}</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">작업 항목</th>
              <th className="px-3 py-2 font-medium">작업 범위</th>
              <th className="w-20 px-3 py-2 font-medium">수량</th>
              <th className="w-24 px-3 py-2 font-medium">단위</th>
              <th className="w-32 px-3 py-2 font-medium">단가</th>
              <th className="w-32 px-3 py-2 text-right font-medium">금액</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <input
                    className={input}
                    value={row.name}
                    onChange={(e) => update(row.id, { name: e.target.value })}
                    placeholder="예: 메인 페이지 디자인"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className={input}
                    value={row.description}
                    onChange={(e) =>
                      update(row.id, { description: e.target.value })
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className={input}
                    inputMode="decimal"
                    value={row.quantity}
                    onChange={(e) =>
                      update(row.id, { quantity: e.target.value })
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    className={input}
                    value={row.unit}
                    onChange={(e) => update(row.id, { unit: e.target.value })}
                  >
                    {unitOptions.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    className={input}
                    inputMode="numeric"
                    value={row.unitPrice}
                    onChange={(e) =>
                      update(row.id, { unitPrice: e.target.value })
                    }
                    placeholder="0"
                  />
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatWon(totals.lineAmounts[i])}
                </td>
                <td className="px-1 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="text-slate-400 hover:text-red-500"
                    aria-label="행 삭제"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-3 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
      >
        + 행 추가
      </button>

      <div className="mt-8 ml-auto max-w-sm space-y-3 rounded-xl border border-slate-200 bg-white p-5 text-sm">
        <label className="flex items-center justify-between gap-3">
          <span className="text-slate-600">세금 방식</span>
          <select
            className={`${input} max-w-[200px]`}
            value={taxMode}
            onChange={(e) => setTaxMode(e.target.value as TaxMode)}
          >
            {preset.taxModes.map((m) => (
              <option key={m} value={m}>
                {TAX_MODE_LABELS[m]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-slate-600">할인</span>
          <input
            className={`${input} max-w-[200px] text-right`}
            inputMode="numeric"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="0"
          />
        </label>

        <dl className="space-y-2 border-t border-slate-100 pt-3 tabular-nums">
          <div className="flex justify-between">
            <dt className="text-slate-600">소계</dt>
            <dd>{formatWon(totals.subtotalAmount)}</dd>
          </div>
          {totals.discountAmount > 0 && (
            <div className="flex justify-between">
              <dt className="text-slate-600">할인</dt>
              <dd>-{formatWon(totals.discountAmount)}</dd>
            </div>
          )}
          {taxMode === "VAT_10" && (
            <div className="flex justify-between">
              <dt className="text-slate-600">부가세</dt>
              <dd>{formatWon(totals.taxAmount)}</dd>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold text-slate-900">
            <dt>{taxMode === "WITHHOLDING_3_3" ? "청구 금액" : "합계"}</dt>
            <dd>{formatWon(totals.totalAmount)}</dd>
          </div>
          {taxMode === "WITHHOLDING_3_3" && (
            <>
              <div className="flex justify-between">
                <dt className="text-slate-600">3.3% 공제</dt>
                <dd>-{formatWon(totals.taxAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">실수령액</dt>
                <dd>{formatWon(totals.netAmount)}</dd>
              </div>
            </>
          )}
        </dl>
        <p className="text-xs text-slate-400">
          참고용 계산이며 실제 세액은 다를 수 있습니다.
        </p>
      </div>
    </div>
  );
}
