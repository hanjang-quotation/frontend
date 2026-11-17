// 문서 API 형식. 백엔드 document/dto 와 같은 구조다. (TECH_SPEC 9.5)

import type { TaxMode } from "@/lib/calc";
import type { Preset } from "@/lib/preset/types";

export type DocType = "ESTIMATE" | "STATEMENT" | "INVOICE";

export type DocumentStatus =
  "DRAFT" | "SENT" | "ACCEPTED" | "PAID" | "EXPIRED" | "CANCELED";

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  DRAFT: "작성 중",
  SENT: "보냄",
  ACCEPTED: "수락됨",
  PAID: "입금 완료",
  EXPIRED: "기한 지남",
  CANCELED: "취소",
};

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  ESTIMATE: "견적서",
  STATEMENT: "거래명세서",
  INVOICE: "청구서",
};

/** 거래처. id 를 주면 저장된 거래처, 없으면 입력한 값을 쓴다 */
export interface ClientInput {
  id?: number | null;
  name?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  businessNo?: string;
  address?: string;
}

/** 품목 한 행. 금액은 보내지 않는다 (서버가 계산) */
export interface LineRequest {
  name: string;
  description?: string;
  quantity: number | null;
  unit?: string;
  unitPrice: number | null;
  extra?: Record<string, unknown>;
}

/** PUT /api/documents/{id}. 합계는 보내지 않는다 */
export interface DocumentUpdateRequest {
  title: string;
  issueDate: string;
  validUntil?: string | null;
  taxMode: TaxMode;
  profileId?: number | null;
  client?: ClientInput | null;
  terms: Record<string, string | number>;
  discountAmount: number | null;
  notes?: string | null;
  lines: LineRequest[];
}

/** POST /api/documents */
export interface DocumentCreateRequest extends DocumentUpdateRequest {
  presetCode: string;
  docType?: DocType;
}

export interface DocumentLine {
  sortOrder: number;
  name: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  amount: number;
  extra: Record<string, unknown>;
}

/** 서버가 계산해 저장한 금액. supply = subtotal − discount */
export interface DocumentAmounts {
  subtotal: number;
  discount: number;
  supply: number;
  tax: number;
  total: number;
  net: number;
}

export interface DocumentResponse {
  id: number;
  docNo: string;
  docType: DocType;
  status: DocumentStatus;
  title: string;
  issueDate: string;
  validUntil: string | null;
  taxMode: TaxMode;
  clientId: number | null;
  /** 작성 시점의 업종 설정. 화면은 이 값으로 그린다 */
  presetSnapshot: Preset;
  partySnapshot: {
    supplier: Record<string, string> | null;
    client: Record<string, string> | null;
  };
  terms: Record<string, unknown>;
  notes: string | null;
  lines: DocumentLine[];
  amounts: DocumentAmounts;
  createdAt: string;
  updatedAt: string;
}

/** 목록의 한 줄 */
export interface DocumentSummary {
  id: number;
  docNo: string;
  docType: DocType;
  status: DocumentStatus;
  title: string;
  clientName: string | null;
  issueDate: string;
  totalAmount: number;
  updatedAt: string;
}

/** 목록 응답. page 는 0부터 */
export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
