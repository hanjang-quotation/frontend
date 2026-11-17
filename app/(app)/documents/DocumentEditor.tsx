"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
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
import type { DocumentStatus } from "@/lib/document/types";
import { formatPhone, formatTime } from "@/lib/format";
import type { Preset } from "@/lib/preset/types";
import StatusSelect from "./StatusSelect";

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
  status,
  savedAt,
}: {
  preset: Preset;
  initial: DocumentForm;
  /** 저장된 문서를 고칠 때만. 없으면 새 문서 */
  documentId?: number;
  docNo?: string;
  /** 저장된 문서의 상태. 있으면 상태 선택을 보여 준다 */
  status?: DocumentStatus;
  /** 새 문서를 방금 저장하고 넘어왔을 때 그 시각. 저장 안내를 띄운 채로 시작한다 */
  savedAt?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  // 마지막으로 서버에 저장된 입력값. 지금 입력값과 다르면 저장하지 않은 수정이 있는 것이다
  const [savedForm, setSavedForm] = useState(initial);
  const dirty = JSON.stringify(form) !== JSON.stringify(savedForm);
  const [nextLineId, setNextLineId] = useState(
    Math.max(0, ...initial.lines.map((l) => l.id)) + 1,
  );
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [save, setSave] = useState<SaveState>(
    savedAt ? { kind: "saved", at: savedAt } : { kind: "idle" },
  );

  // Next 16(cacheComponents)은 다른 화면으로 가면 이 화면을 없애지 않고 숨겨 두었다가 돌아오면 그대로 보여 준다.
  // 숨겨질 때: 사용자가 띄운 저장 안내는 지우고, 새 문서를 저장해 넘어간 경우에는 입력값도 처음으로 되돌린다.
  // 저장하지 않고 다른 화면에 다녀온 경우에는 쓰던 내용을 그대로 둔다.
  // ref 로 표시해 두는 이유: 개발 모드(StrictMode)는 처음 그릴 때도 정리 함수를 한 번 실행하므로,
  // 표시 없이 지우면 처음 열 때 받은 저장 안내(savedAt)까지 사라진다.
  const clearStatusOnHide = useRef(false);
  const resetOnHide = useRef(false);
  useLayoutEffect(() => {
    return () => {
      if (clearStatusOnHide.current) {
        clearStatusOnHide.current = false;
        setSave({ kind: "idle" });
      }
      if (resetOnHide.current) {
        resetOnHide.current = false;
        setForm(initial);
        setSavedForm(initial);
        setNextLineId(Math.max(0, ...initial.lines.map((l) => l.id)) + 1);
        setTab("edit");
      }
    };
  }, [initial]);

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
    clearStatusOnHide.current = true;
    setSave({ kind: "saving" });
    const body = toRequest(form, preset);
    try {
      if (documentId === undefined) {
        const created = await api.documents.create({
          ...body,
          presetCode: preset.code,
        });
        // 수정 화면으로 넘어가서 저장 안내를 띄운다 (EditDocument 가 ?saved 를 읽는다)
        resetOnHide.current = true;
        router.replace(`/documents/${created.id}?saved=1`);
        return;
      }
      const updated = await api.documents.update(documentId, body);
      setSavedForm(form);
      setSave({ kind: "saved", at: formatTime(updated.updatedAt) });
    } catch (e) {
      setSave(saveError(e));
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">
        {documentId === undefined ? "새 견적서" : "견적서 수정"}
      </h1>
      <p className="mt-0.5 text-sm text-slate-500">
        {preset.name}
        {docNo && <span className="ml-2 tabular-nums">{docNo}</span>}
      </p>

      {/* 왼쪽 상태 선택(저장된 문서만), 오른쪽 저장 버튼 */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          {documentId !== undefined && status && (
            <StatusSelect documentId={documentId} initialStatus={status} />
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={save.kind === "saving"}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {save.kind === "saving" ? "저장 중…" : "저장"}
        </button>
      </div>

      {save.kind === "saved" && (
        <div
          role="status"
          className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          <span>
            {save.at}에 저장했습니다.
            {docNo && (
              <span className="ml-1 tabular-nums">문서 번호 {docNo}</span>
            )}
          </span>
          <Link href="/documents" className="font-medium underline">
            내 문서에서 보기
          </Link>
        </div>
      )}

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
                  placeholder="예: 홍길동"
                />
              </Field>
              <Field label="연락처">
                {/* 숫자만 입력해도 하이픈을 넣어 준다. 이 형식 그대로 저장된다 */}
                <input
                  className={input}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.client.phone}
                  onChange={(e) =>
                    changeClient({ phone: formatPhone(e.target.value) })
                  }
                  placeholder="예: 010-1234-5678"
                />
              </Field>
              <Field label="이메일">
                <input
                  className={input}
                  type="email"
                  autoComplete="email"
                  value={form.client.email}
                  onChange={(e) => changeClient({ email: e.target.value })}
                  placeholder="예: contact@company.com"
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
                    <div className="grid grid-cols-[1fr_1fr_2fr] items-start gap-2">
                      <input
                        className={`${input} text-right`}
                        aria-label="수량"
                        inputMode="decimal"
                        value={line.quantity}
                        onChange={(e) =>
                          changeLine(line.id, { quantity: e.target.value })
                        }
                      />
                      <SelectWithCustom
                        label="단위"
                        options={unitOptions}
                        value={line.unit}
                        onChange={(unit) => changeLine(line.id, { unit })}
                        placeholder="예: 컷"
                        maxLength={20}
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
                      <SelectWithCustom
                        label={field.label}
                        options={field.options ?? []}
                        value={form.terms[field.key] ?? ""}
                        onChange={(value) => changeTerm(field.key, value)}
                        emptyLabel="선택 안 함"
                        placeholder={`${field.label} 직접 입력`}
                        maxLength={100}
                      />
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
            {/* 문서 작업 막대: PDF 내려받기. 엑셀 내려받기·문서 변환(2차)도 여기에 둔다.
                미리보기 위에 두어 스크롤하지 않아도 보이게 한다 */}
            <div className="mb-2 flex min-h-9 flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">미리보기</h2>
              {documentId === undefined ? (
                <p className="text-sm text-slate-500">
                  저장하면 PDF로 내려받을 수 있습니다.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {/* PDF 는 서버에 저장된 내용으로 만들어지므로, 저장하지 않은 수정이 있으면 막는다 */}
                  <a
                    href={`/api/documents/${documentId}/pdf`}
                    onClick={(e) => {
                      if (!dirty) return;
                      e.preventDefault();
                      clearStatusOnHide.current = true;
                      setSave({
                        kind: "error",
                        messages: [
                          "저장하지 않은 수정 내용이 있습니다. 저장한 뒤 PDF를 내려받아 주세요.",
                        ],
                      });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    PDF 내려받기
                  </a>
                </div>
              )}
            </div>

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

const CUSTOM = "__custom__";

/**
 * 업종 설정의 select 칸(단위, 결제 조건 등) — 목록 + "직접 입력".
 * 직접 입력을 고르면 아래에 입력란이 나오고, 거기 적은 값이 그대로 저장된다.
 * 목록에 없는 값으로 저장된 문서를 열면 직접 입력 상태로 시작한다.
 *
 * @param emptyLabel 있으면 빈 값을 고를 수 있다 (예: "선택 안 함")
 */
function SelectWithCustom({
  label: text,
  options,
  value,
  onChange,
  emptyLabel,
  placeholder,
  maxLength,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  emptyLabel?: string;
  placeholder: string;
  maxLength: number;
}) {
  // 빈 값은 "선택 안 함"과 "직접 입력 직후"가 같아 보이므로 직접 입력 중인지 따로 기억한다
  const [custom, setCustom] = useState(
    () =>
      !options.includes(value) && (value !== "" || emptyLabel === undefined),
  );
  // 사용자가 직접 입력을 고른 순간에만 입력란으로 커서를 옮긴다
  const [focusInput, setFocusInput] = useState(false);

  return (
    <div className="space-y-2">
      <select
        className={input}
        aria-label={text}
        value={custom ? CUSTOM : value}
        onChange={(e) => {
          const next = e.target.value;
          setCustom(next === CUSTOM);
          setFocusInput(next === CUSTOM);
          onChange(next === CUSTOM ? "" : next);
        }}
      >
        {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
        <option value={CUSTOM}>직접 입력</option>
      </select>
      {custom && (
        <input
          className={input}
          aria-label={`${text} 직접 입력`}
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={focusInput}
        />
      )}
    </div>
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
