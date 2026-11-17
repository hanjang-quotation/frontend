// 작성 화면의 입력값과 API 요청·응답 사이의 변환.
// 입력란은 모두 문자열로 다루고, 보낼 때 숫자로 바꾼다.

import { calculateTotals, type TaxMode, type Totals } from "@/lib/calc";
import type { Preset } from "@/lib/preset/types";
import type {
  ClientInput,
  DocumentResponse,
  DocumentUpdateRequest,
} from "./types";

export interface LineForm {
  /** 화면에서 행을 구분하는 값. 서버에는 보내지 않는다 */
  id: number;
  name: string;
  description: string;
  quantity: string;
  unit: string;
  /** 쉼표가 들어간 문자열. 예: "1,500,000" */
  unitPrice: string;
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
  notes: string;
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

/** 빈 값이면 null, 숫자가 아니면 NaN 대신 null (서버가 "입력해 주세요"로 알려 준다) */
export function parseNumber(value: string): number | null {
  const trimmed = value.replaceAll(",", "").trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function emptyLine(id: number, preset: Preset): LineForm {
  const unitOptions = unitOptionsOf(preset);
  const quantityDefault = preset.columns.find(
    (c) => c.key === "quantity",
  )?.default;
  return {
    id,
    name: "",
    description: "",
    quantity: quantityDefault === undefined ? "1" : String(quantityDefault),
    unit: unitOptions[0] ?? "",
    unitPrice: "",
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
  return {
    title: "",
    issueDate: today,
    validUntil: "",
    client: EMPTY_CLIENT,
    terms,
    taxMode: preset.defaultTaxMode,
    discount: "",
    notes: "",
    lines: [emptyLine(1, preset)],
  };
}

/** 저장된 문서를 입력값으로 바꾼다 */
export function formFromDocument(doc: DocumentResponse): DocumentForm {
  const client = doc.partySnapshot.client ?? {};
  const terms: Record<string, string> = {};
  for (const field of doc.presetSnapshot.termFields) {
    const value = doc.terms[field.key];
    terms[field.key] =
      value === undefined || value === null ? "" : String(value);
  }
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
    notes: doc.notes ?? "",
    lines: doc.lines.map((line, i) => ({
      id: i + 1,
      name: line.name,
      description: line.description ?? "",
      quantity: String(line.quantity),
      unit: line.unit ?? "",
      unitPrice: withCommas(String(line.unitPrice)),
    })),
  };
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

  return {
    profileId: form.profileId ?? null,
    title: form.title.trim(),
    issueDate: form.issueDate,
    validUntil: form.validUntil || null,
    taxMode: form.taxMode,
    client: clientRequest(form.client),
    terms,
    discountAmount: parseNumber(form.discount) ?? 0,
    notes: form.notes.trim() || null,
    lines: form.lines.map((line) => ({
      name: line.name.trim(),
      description: line.description.trim(),
      quantity: parseNumber(line.quantity),
      unit: line.unit,
      unitPrice: parseNumber(line.unitPrice),
    })),
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

/** 미리보기용 합계. 저장할 때는 서버가 다시 계산한다 */
export function formTotals(form: DocumentForm): Totals {
  return calculateTotals(
    form.lines.map((line) => ({
      quantity: parseNumber(line.quantity) ?? 0,
      unitPrice: parseNumber(line.unitPrice) ?? 0,
    })),
    parseNumber(form.discount) ?? 0,
    form.taxMode,
  );
}
