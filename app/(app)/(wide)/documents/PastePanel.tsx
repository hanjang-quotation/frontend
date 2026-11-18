"use client";

import { useState } from "react";
import { inputClass } from "@/components/form";
import { pricePartsOf } from "@/lib/document/form";
import { parsePasted, type PastedRow } from "@/lib/document/paste";
import type { Preset } from "@/lib/preset/types";

/**
 * 엑셀에서 붙여넣기. 엑셀에서 품목 칸(여러 줄·여러 칸)을 복사해 붙여넣으면 어림으로 나눠 미리 보여 주고,
 * 사용자가 확인한 뒤 품목으로 넣는다. 나누는 규칙은 lib/document/paste.ts
 */
export default function PastePanel({
  preset,
  onInsert,
  onClose,
}: {
  preset: Preset;
  onInsert: (rows: PastedRow[]) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const rows = text.trim() ? parsePasted(text, preset) : [];
  const parts = pricePartsOf(preset);
  const nameLabel =
    preset.columns.find((c) => c.key === "name")?.label ?? "품명";
  const order =
    parts.length > 0
      ? `${nameLabel}, 규격, 수량, 단위, ${parts.map((p) => p.label).join(", ")}`
      : `${nameLabel}, 규격, 수량, 단위, 단가`;

  return (
    <div className="mt-3 rounded-lg border border-rule bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">엑셀에서 붙여넣기</p>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-slate-500 hover:text-ink"
        >
          닫기
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        엑셀에서 품목 칸을 여러 줄 복사해 아래에 붙여넣으세요. 열 순서는 {order}{" "}
        순이 가장 잘 맞습니다. 번호·금액 열과 표 머리 줄은 알아서 뺍니다. 넣기
        전에 아래에서 확인하세요.
      </p>
      <textarea
        className={`${inputClass} mt-2 min-h-24 font-mono text-xs`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="여기에 붙여넣기 (Ctrl+V)"
        aria-label="엑셀에서 복사한 품목"
        autoFocus
      />

      {text.trim() && rows.length === 0 && (
        <p className="mt-2 text-xs text-red-700">
          품목으로 읽을 수 있는 줄이 없습니다. 품명이 들어 있는 칸을 함께
          복사했는지 확인해 주세요.
        </p>
      )}

      {rows.length > 0 && (
        <>
          <div className="mt-2 max-h-60 overflow-auto rounded border border-rule bg-paper">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-2 py-1 text-left font-medium">
                    {nameLabel}
                  </th>
                  <th className="px-2 py-1 text-left font-medium">규격</th>
                  <th className="px-2 py-1 text-right font-medium">수량</th>
                  <th className="px-2 py-1 text-left font-medium">단위</th>
                  {parts.length > 0 ? (
                    parts.map((p) => (
                      <th
                        key={p.key}
                        className="px-2 py-1 text-right font-medium"
                      >
                        {p.label}
                      </th>
                    ))
                  ) : (
                    <th className="px-2 py-1 text-right font-medium">단가</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-t border-rule">
                    <td className="px-2 py-1 text-ink">{row.name}</td>
                    <td className="px-2 py-1 text-slate-600">
                      {row.description}
                    </td>
                    <td className="px-2 py-1 text-right tabular-nums">
                      {row.quantity}
                    </td>
                    <td className="px-2 py-1">{row.unit}</td>
                    {parts.length > 0 ? (
                      parts.map((p) => (
                        <td
                          key={p.key}
                          className="px-2 py-1 text-right tabular-nums"
                        >
                          {row.parts[p.key]}
                        </td>
                      ))
                    ) : (
                      <td className="px-2 py-1 text-right tabular-nums">
                        {row.unitPrice}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => onInsert(rows)}
              className="rounded-md bg-pen px-3 py-1.5 text-sm font-medium text-white hover:bg-pen-deep"
            >
              {rows.length}줄 넣기
            </button>
          </div>
        </>
      )}
    </div>
  );
}
