// 작성 화면의 입력값과 API 요청·응답 사이의 변환.
// 입력란은 모두 문자열로 다루고, 보낼 때 숫자로 바꾼다.

import { calculateTotals, type TaxMode, type Totals } from "@/lib/calc";
import type { Preset, PresetColumn } from "@/lib/preset/types";
import type {
  ClientInput,
  DocumentResponse,
  DocumentUpdateRequest,
} from "./types";

export interface LineForm {
  /** 화면에서 행을 구분하는 값. 서버에는 보내지 않는다 */
  id: number;
  /** 묶음을 쓰는 업종(useGroups)에서 이 행이 속한 GroupForm.id. 그 밖에는 null */
  groupId: number | null;
  name: string;
  description: string;
  quantity: string;
  unit: string;
  /** 쉼표가 들어간 문자열. 예: "1,500,000". 단가를 나눠 받는 업종은 쓰지 않는다 */
  unitPrice: string;
  /**
   * 업종별 추가 열의 입력값. 예: 시공의 materialPrice·laborPrice (쉼표가 들어간 금액),
   * 인쇄의 paper·printing·finishing (글자)
   */
  extra: Record<string, string>;
  /** 수량별 가격 (quantityOptions 열이 있는 업종만). 합계에는 들어가지 않는다 */
  options?: QuantityOptionForm[];
}

/** 수량별 가격 한 줄. 예: 500매 45,000원 */
export interface QuantityOptionForm {
  quantity: string;
  /** 쉼표가 들어간 금액 */
  amount: string;
}

/** 행 묶음 (예: 시공의 공종) */
export interface GroupForm {
  /** 화면에서 묶음을 구분하는 값. 서버에는 순번으로 보낸다 */
  id: number;
  name: string;
}

export interface ClientForm {
  /** 저장된 거래처를 골랐을 때만. 칸을 고치면 직접 입력으로 바뀌어 null 이 된다 */
  id: number | null;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  businessNo: string;
  address: string;
}

export const EMPTY_CLIENT: ClientForm = {
  id: null,
  name: "",
  contactName: "",
  phone: "",
  email: "",
  businessNo: "",
  address: "",
};

export interface DocumentForm {
  /**
   * 공급자로 고른 내 정보. null 이면 고르지 않음(수정할 때는 기존 공급자 유지).
   * undefined 는 새 문서에서 아직 정하지 않은 상태로, 내 정보 목록을 불러오면 기본 내 정보로 정한다
   */
  profileId?: number | null;
  title: string;
  /** YYYY-MM-DD */
  issueDate: string;
  validUntil: string;
  client: ClientForm;
  /** 업종 설정 termFields 의 key → 입력값 */
  terms: Record<string, string>;
  taxMode: TaxMode;
  discount: string;
  /** 업종 설정 surcharges 의 key → 비율(%) 입력값. 예: "5", "2.5" */
  surcharges: Record<string, string>;
  notes: string;
  /** 묶음 (useGroups 업종만, 그 밖에는 빈 목록) */
  groups: GroupForm[];
  /** 묶음을 쓰는 업종에서는 항상 묶음 순서대로 붙어 있다 (같은 묶음의 행이 이어진다) */
  lines: LineForm[];
}

/** 오늘 날짜(내 컴퓨터 기준) YYYY-MM-DD. 브라우저에서만 부른다 */
export function todayString(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 숫자만 남기고 세 자리마다 쉼표. 금액 입력란에 쓴다 */
export function withCommas(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits === "" ? "" : Number(digits).toLocaleString("ko-KR");
}

/** 비율(%) 입력란: 숫자와 소수점 하나, 소수 첫째 자리까지 */
export function percentInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  if (rest.length === 0) return whole;
  return `${whole}.${rest.join("").slice(0, 1)}`;
}

/** 빈 값이면 null, 숫자가 아니면 NaN 대신 null (서버가 "입력해 주세요"로 알려 준다) */
export function parseNumber(value: string): number | null {
  const trimmed = value.replaceAll(",", "").trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/** 단가를 나눠 받는 열 (예: 자재 단가·노무 단가). 없으면 빈 목록 */
export function pricePartsOf(preset: Preset): PresetColumn[] {
  return preset.columns.filter((c) => c.partOf === "unitPrice");
}

/** 품명 아래 한 줄에 보여 주는 사양 열 (예: 인쇄의 용지·인쇄·후가공) */
export function detailColumnsOf(preset: Preset): PresetColumn[] {
  return preset.columns.filter((c) => c.display === "detail");
}

/** 수량별 가격 열. 없으면 undefined */
export function optionsColumnOf(preset: Preset): PresetColumn | undefined {
  return preset.columns.find((c) => c.type === "quantityOptions");
}

/** 품명 아래 한 줄: 규격 · 용지 · 인쇄 · 후가공 (빈 칸은 뺀다) */
export function lineDetail(line: LineForm, preset: Preset): string {
  return [
    line.description,
    ...detailColumnsOf(preset).map((c) => line.extra[c.key] ?? ""),
  ]
    .map((v) => v.trim())
    .filter((v) => v !== "")
    .join(" · ");
}

/** 수량과 금액을 다 적은 수량별 가격만 */
export function filledOptions(line: LineForm): QuantityOptionForm[] {
  return (line.options ?? []).filter(
    (o) => parseNumber(o.quantity) !== null && parseNumber(o.amount) !== null,
  );
}

/** 행의 단가(원). 나눠 받는 업종은 나눈 칸의 합 */
export function lineUnitPrice(line: LineForm, preset: Preset): number {
  const parts = pricePartsOf(preset);
  if (parts.length === 0) return parseNumber(line.unitPrice) ?? 0;
  return parts.reduce(
    (sum, part) => sum + (parseNumber(line.extra[part.key] ?? "") ?? 0),
    0,
  );
}

/** 비율 입력값(%)을 1000분율 정수로. 5 → 50, 2.5 → 25 */
function perMilleOf(value: string): number {
  return Math.round((parseNumber(value) ?? 0) * 10);
}

export function emptyLine(
  id: number,
  preset: Preset,
  groupId: number | null = null,
): LineForm {
  const unitOptions = unitOptionsOf(preset);
  const quantityDefault = preset.columns.find(
    (c) => c.key === "quantity",
  )?.default;
  const extra: Record<string, string> = {};
  for (const part of pricePartsOf(preset)) extra[part.key] = "";
  for (const column of detailColumnsOf(preset)) extra[column.key] = "";
  return {
    id,
    groupId,
    name: "",
    description: "",
    quantity: quantityDefault === undefined ? "1" : String(quantityDefault),
    unit: unitOptions[0] ?? "",
    unitPrice: "",
    extra,
    options: [],
  };
}

export function unitOptionsOf(preset: Preset): string[] {
  return preset.columns.find((c) => c.key === "unit")?.options ?? [];
}

export function emptyForm(preset: Preset, today: string): DocumentForm {
  const terms: Record<string, string> = {};
  for (const field of preset.termFields) {
    terms[field.key] = field.default === undefined ? "" : String(field.default);
  }
  const surcharges: Record<string, string> = {};
  for (const s of preset.surcharges ?? []) surcharges[s.key] = "";
  const groups = preset.useGroups ? [{ id: 1, name: "" }] : [];
  return {
    title: "",
    issueDate: today,
    validUntil: "",
    client: EMPTY_CLIENT,
    terms,
    taxMode: preset.defaultTaxMode,
    discount: "",
    surcharges,
    notes: "",
    groups,
    lines: [emptyLine(1, preset, preset.useGroups ? 1 : null)],
  };
}

/**
 * 예전 형식(묶음·가산 항목이 생기기 전)으로 보관된 입력값을 지금 형식으로 맞춘다.
 * 브라우저 임시 보관본을 되살릴 때 쓴다
 */
export function normalizeForm(
  form: DocumentForm,
  preset: Preset,
): DocumentForm {
  const blank = emptyForm(preset, form.issueDate);
  const groups = Array.isArray(form.groups) ? form.groups : [];
  if (preset.useGroups && groups.length === 0) return blank;
  return {
    ...form,
    surcharges: { ...blank.surcharges, ...(form.surcharges ?? {}) },
    groups,
    lines: form.lines.map((line) => ({
      ...line,
      groupId: line.groupId ?? null,
      extra: { ...emptyLine(0, preset).extra, ...(line.extra ?? {}) },
    })),
  };
}

/** 저장된 문서를 입력값으로 바꾼다 */
export function formFromDocument(doc: DocumentResponse): DocumentForm {
  const preset = doc.presetSnapshot;
  const client = doc.partySnapshot.client ?? {};
  const terms: Record<string, string> = {};
  for (const field of preset.termFields) {
    const value = doc.terms[field.key];
    terms[field.key] =
      value === undefined || value === null ? "" : String(value);
  }
  const surcharges: Record<string, string> = {};
  for (const s of preset.surcharges ?? []) {
    const rate = doc.surcharges?.find((x) => x.key === s.key)?.rate ?? 0;
    surcharges[s.key] = rate > 0 ? String(rate) : "";
  }
  const parts = pricePartsOf(preset);
  const details = detailColumnsOf(preset);
  const optionsColumn = optionsColumnOf(preset);
  const groups = (doc.groups ?? []).map((g, i) => ({
    id: i + 1,
    name: g.name,
  }));
  const lines = doc.lines.map((line, i) => {
    const extra: Record<string, string> = {};
    for (const part of parts) {
      const value = line.extra?.[part.key];
      extra[part.key] =
        value === undefined || value === null ? "" : withCommas(String(value));
    }
    for (const column of details) {
      const value = line.extra?.[column.key];
      extra[column.key] =
        value === undefined || value === null ? "" : String(value);
    }
    const saved = optionsColumn ? line.extra?.[optionsColumn.key] : undefined;
    const options = Array.isArray(saved)
      ? (saved as { quantity: number; amount: number }[]).map((o) => ({
          quantity: String(o.quantity),
          amount: withCommas(String(o.amount)),
        }))
      : [];
    return {
      options,
      id: i + 1,
      groupId:
        line.group === null || line.group === undefined ? null : line.group + 1,
      name: line.name,
      description: line.description ?? "",
      quantity: String(line.quantity),
      unit: line.unit ?? "",
      unitPrice: withCommas(String(line.unitPrice)),
      extra,
    };
  });
  return {
    profileId: doc.profileId,
    title: doc.title,
    issueDate: doc.issueDate,
    validUntil: doc.validUntil ?? "",
    client: {
      id: doc.clientId,
      name: client.name ?? "",
      contactName: client.contactName ?? "",
      phone: client.phone ?? "",
      email: client.email ?? "",
      businessNo: client.businessNo ?? "",
      address: client.address ?? "",
    },
    terms,
    taxMode: doc.taxMode,
    discount:
      doc.amounts.discount > 0 ? withCommas(String(doc.amounts.discount)) : "",
    surcharges,
    notes: doc.notes ?? "",
    groups,
    lines: sortByGroups(lines, groups),
  };
}

/** 행을 묶음 순서대로 다시 늘어놓는다. 같은 묶음 안의 순서는 그대로. 묶음이 없으면 그대로 */
export function sortByGroups(
  lines: LineForm[],
  groups: GroupForm[],
): LineForm[] {
  if (groups.length === 0) return lines;
  const order = new Map(groups.map((g, i) => [g.id, i]));
  return [...lines].sort(
    (a, b) =>
      (order.get(a.groupId ?? -1) ?? 0) - (order.get(b.groupId ?? -1) ?? 0),
  );
}

/** 입력값을 API 요청으로 바꾼다. 합계는 넣지 않는다 */
export function toRequest(
  form: DocumentForm,
  preset: Preset,
): DocumentUpdateRequest {
  const terms: Record<string, string | number> = {};
  for (const field of preset.termFields) {
    const value = (form.terms[field.key] ?? "").trim();
    if (value === "") continue;
    const n = field.type === "number" ? parseNumber(value) : null;
    terms[field.key] = n ?? value;
  }

  const surchargeRates: Record<string, number> = {};
  for (const s of preset.surcharges ?? []) {
    surchargeRates[s.key] = parseNumber(form.surcharges[s.key] ?? "") ?? 0;
  }

  const parts = pricePartsOf(preset);
  const details = detailColumnsOf(preset);
  const optionsColumn = optionsColumnOf(preset);
  const groupIndex = new Map(form.groups.map((g, i) => [g.id, i]));

  return {
    profileId: form.profileId ?? null,
    title: form.title.trim(),
    issueDate: form.issueDate,
    validUntil: form.validUntil || null,
    taxMode: form.taxMode,
    client: clientRequest(form.client),
    terms,
    discountAmount: parseNumber(form.discount) ?? 0,
    surchargeRates,
    notes: form.notes.trim() || null,
    groups: form.groups.map((g) => ({ name: g.name.trim() })),
    lines: sortByGroups(form.lines, form.groups).map((line) => {
      const extra: Record<string, unknown> = {};
      for (const part of parts) {
        extra[part.key] = parseNumber(line.extra[part.key] ?? "");
      }
      for (const column of details) {
        const value = (line.extra[column.key] ?? "").trim();
        if (value !== "") extra[column.key] = value;
      }
      if (optionsColumn) {
        extra[optionsColumn.key] = filledOptions(line).map((o) => ({
          quantity: parseNumber(o.quantity),
          amount: parseNumber(o.amount),
        }));
      }
      return {
        name: line.name.trim(),
        description: line.description.trim(),
        quantity: parseNumber(line.quantity),
        unit: line.unit,
        // 나눠 받는 업종은 서버가 extra 의 합으로 정한다
        unitPrice: parts.length > 0 ? null : parseNumber(line.unitPrice),
        group:
          line.groupId === null ? null : (groupIndex.get(line.groupId) ?? null),
        ...(Object.keys(extra).length > 0 ? { extra } : {}),
      };
    }),
  };
}

/** 저장된 거래처면 id 만, 직접 입력이면 칸의 값을. 아무것도 없으면 null */
function clientRequest(c: ClientForm): ClientInput | null {
  if (c.id !== null) return { id: c.id };
  const fields = {
    name: c.name.trim(),
    contactName: c.contactName.trim(),
    phone: c.phone.trim(),
    email: c.email.trim(),
    businessNo: c.businessNo.trim(),
    address: c.address.trim(),
  };
  return Object.values(fields).some((v) => v !== "") ? fields : null;
}

/**
 * 미리보기용 합계. 저장할 때는 서버가 다시 계산한다.
 * lineAmounts 는 form.lines 와 같은 순서다
 */
export function formTotals(form: DocumentForm, preset: Preset): Totals {
  return calculateTotals(
    form.lines.map((line) => ({
      quantity: parseNumber(line.quantity) ?? 0,
      unitPrice: lineUnitPrice(line, preset),
    })),
    parseNumber(form.discount) ?? 0,
    form.taxMode,
    (preset.surcharges ?? []).map((s) =>
      perMilleOf(form.surcharges[s.key] ?? ""),
    ),
  );
}
