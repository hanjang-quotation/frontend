"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DocumentPreview from "@/components/document/DocumentPreview";
import { ApiError, api } from "@/lib/api/client";
import { TAX_MODE_LABELS, formatWon, type TaxMode } from "@/lib/calc";
import {
  emptyLine,
  formTotals,
  toRequest,
  unitOptionsOf,
  withCommas,
  type ClientForm,
  type DocumentForm,
  type LineForm,
} from "@/lib/document/form";
import type { Preset } from "@/lib/preset/types";

// 견적서 작성·수정 화면 (TECH_SPEC 10.1).
// PC 는 왼쪽 입력·오른쪽 미리보기, 모바일은 탭으로 전환한다.
// 입력 순서: 거래처 → 건명·날짜 → 품목 → 조건 → 세금 방식과 합계 → 비고.
// 내 정보(공급자)는 6단계에서 붙인다.

const input =
  "w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none";
const label = "mb-1 block text-xs font-medium text-slate-600";

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: string }
  | { kind: "error"; messages: string[]; needLogin?: boolean };

export default function DocumentEditor({
  preset,
  initial,
  documentId,
  docNo,
}: {
  preset: Preset;
  initial: DocumentForm;
  /** 저장된 문서를 고칠 때만. 없으면 새 문서 */
  documentId?: number;
  docNo?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [nextLineId, setNextLineId] = useState(
    Math.max(0, ...initial.lines.map((l) => l.id)) + 1,
  );
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [save, setSave] = useState<SaveState>({ kind: "idle" });

  const totals = formTotals(form);
  const unitOptions = unitOptionsOf(preset);

  const change = (patch: Partial<DocumentForm>) =>
    setForm((prev) => ({ ...prev, ...patch }));
  const changeClient = (patch: Partial<ClientForm>) =>
    setForm((prev) => ({ ...prev, client: { ...prev.client, ...patch } }));
  const changeTerm = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, terms: { ...prev.terms, [key]: value } }));
  const changeLine = (id: number, patch: Partial<LineForm>) =>
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));

  const addLine = () => {
    setForm((prev) => ({
      ...prev,
      lines: [...prev.lines, emptyLine(nextLineId, preset)],
    }));
    setNextLineId((n) => n + 1);
  };
  const removeLine = (id: number) =>
    setForm((prev) =>
      prev.lines.length > 1
        ? { ...prev, lines: prev.lines.filter((l) => l.id !== id) }
        : prev,
    );
  /** 행을 위(-1)나 아래(+1)로 한 칸 옮긴다 */
  const moveLine = (index: number, step: -1 | 1) =>
    setForm((prev) => {
      const target = index + step;
      if (target < 0 || target >= prev.lines.length) return prev;
      const lines = [...prev.lines];
      [lines[index], lines[target]] = [lines[target], lines[index]];
      return { ...prev, lines };
    });

  async function handleSave() {
    setSave({ kind: "saving" });
    const body = toRequest(form, preset);
    try {
      if (documentId === undefined) {
        const created = await api.documents.create({
          ...body,
          presetCode: preset.code,
        });
        router.replace(`/documents/${created.id}`);
        return;
      }
      const updated = await api.documents.update(documentId, body);
      setSave({
        kind: "saved",
        at: new Date(updated.updatedAt).toLocaleTimeString("ko-KR"),
      });
    } catch (e) {
      setSave(saveError(e));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {documentId === undefined ? "새 견적서" : "견적서 수정"}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {preset.name}
            {docNo && <span className="ml-2 tabular-nums">{docNo}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {save.kind === "saved" && (
            <span className="text-sm text-green-700">
              {save.at}에 저장했습니다
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={save.kind === "saving"}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {save.kind === "saving" ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>

      {save.kind === "error" && (
        <div
          role="alert"
          className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <ul className="list-disc space-y-0.5 pl-4">
            {save.messages.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          {save.needLogin && (
            <Link
              href="/login"
              className="mt-2 inline-block font-medium underline"
            >
              로그인하러 가기
            </Link>
          )}
        </div>
      )}

      {/* 모바일에서만 보이는 탭 */}
      <div className="mt-4 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm lg:hidden">
        {(["edit", "preview"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-md py-1.5 ${tab === t ? "bg-white font-medium text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            {t === "edit" ? "입력" : "미리보기"}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className={`space-y-5 ${tab === "edit" ? "" : "hidden"} lg:block`}>
          <Section title="거래처">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="상호 또는 이름">
                <input
                  className={input}
                  value={form.client.name}
                  onChange={(e) => changeClient({ name: e.target.value })}
                  placeholder="예: 가나다 주식회사"
                />
              </Field>
              <Field label="담당자">
                <input
                  className={input}
                  value={form.client.contactName}
                  onChange={(e) =>
                    changeClient({ contactName: e.target.value })
                  }
                />
              </Field>
              <Field label="연락처">
                <input
                  className={input}
                  inputMode="tel"
                  value={form.client.phone}
                  onChange={(e) => changeClient({ phone: e.target.value })}
                />
              </Field>
              <Field label="이메일">
                <input
                  className={input}
                  type="email"
                  value={form.client.email}
                  onChange={(e) => changeClient({ email: e.target.value })}
                />
              </Field>
            </div>
          </Section>

          <Section title="건명·날짜">
            <Field label="건명">
              <input
                className={input}
                value={form.title}
                onChange={(e) => change({ title: e.target.value })}
                placeholder="예: 회사 소개 홈페이지 제작"
              />
            </Field>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="작성일">
                <input
                  className={input}
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => change({ issueDate: e.target.value })}
                />
              </Field>
              <Field label="유효기간 (선택)">
                <input
                  className={input}
                  type="date"
                  value={form.validUntil}
                  min={form.issueDate}
                  onChange={(e) => change({ validUntil: e.target.value })}
                />
              </Field>
            </div>
          </Section>

          <Section title="품목">
            <ol className="space-y-3">
              {form.lines.map((line, i) => (
                <li
                  key={line.id}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{i + 1}번째 품목</span>
                    <span className="flex gap-1">
                      <IconButton
                        label="위로"
                        disabled={i === 0}
                        onClick={() => moveLine(i, -1)}
                      >
                        ↑
                      </IconButton>
                      <IconButton
                        label="아래로"
                        disabled={i === form.lines.length - 1}
                        onClick={() => moveLine(i, 1)}
                      >
                        ↓
                      </IconButton>
                      <IconButton
                        label="삭제"
                        disabled={form.lines.length === 1}
                        onClick={() => removeLine(line.id)}
                      >
                        ×
                      </IconButton>
                    </span>
                  </div>
                  <div className="mt-2 space-y-2">
                    <input
                      className={input}
                      aria-label="작업 항목"
                      value={line.name}
                      onChange={(e) =>
                        changeLine(line.id, { name: e.target.value })
                      }
                      placeholder="작업 항목 (예: 메인 페이지 디자인)"
                    />
                    <input
                      className={input}
                      aria-label="작업 범위"
                      value={line.description}
                      onChange={(e) =>
                        changeLine(line.id, { description: e.target.value })
                      }
                      placeholder="작업 범위 (선택)"
                    />
                    <div className="grid grid-cols-[1fr_1fr_2fr] gap-2">
                      <input
                        className={`${input} text-right`}
                        aria-label="수량"
                        inputMode="decimal"
                        value={line.quantity}
                        onChange={(e) =>
                          changeLine(line.id, { quantity: e.target.value })
                        }
                      />
                      <UnitSelect
                        options={unitOptions}
                        value={line.unit}
                        onChange={(unit) => changeLine(line.id, { unit })}
                      />
                      <input
                        className={`${input} text-right`}
                        aria-label="단가"
                        inputMode="numeric"
                        value={line.unitPrice}
                        onChange={(e) =>
                          changeLine(line.id, {
                            unitPrice: withCommas(e.target.value),
                          })
                        }
                        placeholder="단가"
                      />
                    </div>
                    {isCustomUnit(unitOptions, line.unit) && (
                      <input
                        className={input}
                        aria-label="단위 직접 입력"
                        maxLength={20}
                        value={line.unit}
                        onChange={(e) =>
                          changeLine(line.id, { unit: e.target.value })
                        }
                        placeholder="단위 직접 입력 (예: 컷, 개, 회)"
                        autoFocus={line.unit === ""}
                      />
                    )}
                    <p className="text-right text-sm tabular-nums text-slate-700">
                      금액 {formatWon(totals.lineAmounts[i])}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={addLine}
              className="mt-3 w-full rounded-md border border-dashed border-slate-300 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              + 품목 추가
            </button>
          </Section>

          {preset.termFields.length > 0 && (
            <Section title="조건">
              <div className="grid gap-3 sm:grid-cols-2">
                {preset.termFields.map((field) => (
                  <Field key={field.key} label={field.label}>
                    {field.type === "select" ? (
                      <select
                        className={input}
                        value={form.terms[field.key] ?? ""}
                        onChange={(e) => changeTerm(field.key, e.target.value)}
                      >
                        <option value="">선택 안 함</option>
                        {field.options?.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className={input}
                        type={field.type === "date" ? "date" : "text"}
                        inputMode={
                          field.type === "number" ? "numeric" : undefined
                        }
                        value={form.terms[field.key] ?? ""}
                        onChange={(e) => changeTerm(field.key, e.target.value)}
                      />
                    )}
                  </Field>
                ))}
              </div>
            </Section>
          )}

          <Section title="세금 방식과 합계">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="세금 방식">
                <select
                  className={input}
                  value={form.taxMode}
                  onChange={(e) =>
                    change({ taxMode: e.target.value as TaxMode })
                  }
                >
                  {preset.taxModes.map((m) => (
                    <option key={m} value={m}>
                      {TAX_MODE_LABELS[m]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="할인 (원)">
                <input
                  className={`${input} text-right`}
                  inputMode="numeric"
                  value={form.discount}
                  onChange={(e) =>
                    change({ discount: withCommas(e.target.value) })
                  }
                  placeholder="0"
                />
              </Field>
            </div>
            <p className="mt-3 text-right text-base font-semibold tabular-nums text-slate-900">
              {form.taxMode === "WITHHOLDING_3_3" ? "청구 금액" : "합계"}{" "}
              {formatWon(totals.totalAmount)}
            </p>
            {form.taxMode === "WITHHOLDING_3_3" && (
              <p className="text-right text-sm tabular-nums text-slate-500">
                공제 {formatWon(totals.taxAmount)} · 실수령{" "}
                {formatWon(totals.netAmount)}
              </p>
            )}
          </Section>

          <Section title="비고">
            <textarea
              className={`${input} min-h-24`}
              value={form.notes}
              onChange={(e) => change({ notes: e.target.value })}
              placeholder="예: 계약금 입금 후 작업을 시작합니다."
            />
          </Section>
        </div>

        <div className={`${tab === "preview" ? "" : "hidden"} lg:block`}>
          <div className="lg:sticky lg:top-4">
            <DocumentPreview
              preset={preset}
              form={form}
              totals={totals}
              docNo={docNo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** 저장 실패를 화면에 보여 줄 문장으로 바꾼다 */
function saveError(e: unknown): SaveState {
  if (e instanceof ApiError) {
    if (e.status === 401) {
      return {
        kind: "error",
        messages: ["로그인해야 저장할 수 있습니다."],
        needLogin: true,
      };
    }
    const fieldMessages = Object.values(e.body.fields ?? {});
    return {
      kind: "error",
      messages:
        fieldMessages.length > 0
          ? [...new Set(fieldMessages)]
          : [e.body.message],
    };
  }
  return {
    kind: "error",
    messages: ["저장하지 못했습니다. 잠시 후 다시 시도해 주세요."],
  };
}

/** 단위 목록에 없는 값(빈 값 포함)이면 사용자가 직접 입력하는 중이다 */
function isCustomUnit(options: string[], unit: string): boolean {
  return !options.includes(unit);
}

const CUSTOM_UNIT = "__custom__";

/**
 * 업종 설정의 단위 목록 + "직접 입력". 직접 입력을 고르면 단위를 비우고,
 * 그 아래에 나오는 입력란에 적은 값이 그대로 단위가 된다.
 */
function UnitSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (unit: string) => void;
}) {
  const custom = isCustomUnit(options, value);
  return (
    <select
      className={input}
      aria-label="단위"
      value={custom ? CUSTOM_UNIT : value}
      onChange={(e) =>
        onChange(e.target.value === CUSTOM_UNIT ? "" : e.target.value)
      }
    >
      {options.map((u) => (
        <option key={u}>{u}</option>
      ))}
      <option value={CUSTOM_UNIT}>직접 입력</option>
    </select>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label: text,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={label}>{text}</span>
      {children}
    </label>
  );
}

function IconButton({
  label: text,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={text}
      title={text}
      disabled={disabled}
      onClick={onClick}
      className="h-6 w-6 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
