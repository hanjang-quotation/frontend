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

/**
 * 문서 종류별 날짜 칸 이름. until 이 null 이면 두 번째 날짜(validUntil)를 쓰지 않는다.
 * 백엔드 DocType 의 issueDateLabel·validUntilLabel 과 같아야 한다
 */
export const DOC_DATE_LABELS: Record<
  DocType,
  { issue: string; until: string | null }
> = {
  ESTIMATE: { issue: "작성일", until: "유효기간" },
  STATEMENT: { issue: "거래일", until: null },
  INVOICE: { issue: "청구일", until: "입금 기한" },
};

/** 변환으로 이어진 문서 (원본, 또는 이 문서로 만든 문서) */
export interface RelatedDocument {
  id: number;
  docNo: string;
  docType: DocType;
}

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
  /** 단가를 나눠 받는 업종(자재·노무)은 서버가 extra 의 합으로 정한다 */
  unitPrice: number | null;
  /** 묶음을 쓰는 업종: 이 행이 속한 groups 의 순번(0부터) */
  group?: number | null;
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
  /** 가산 항목 key → 비율(%) */
  surchargeRates?: Record<string, number>;
  notes?: string | null;
  /** 묶음 (useGroups 업종만) */
  groups?: { name: string }[];
  lines: LineRequest[];
}

/** POST /api/documents */
export interface DocumentCreateRequest extends DocumentUpdateRequest {
  presetCode: string;
  docType?: DocType;
}

export interface DocumentLine {
  sortOrder: number;
  /** 묶음 순번 (useGroups 업종만) */
  group: number | null;
  name: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  amount: number;
  extra: Record<string, unknown>;
}

/** 서버가 계산해 저장한 금액. supply = subtotal + 가산 − discount */
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
  /** 공급자로 고른 내 정보. 지워졌으면 null (공급자 스냅샷은 남는다) */
  profileId: number | null;
  clientId: number | null;
  /** 작성 시점의 업종 설정. 화면은 이 값으로 그린다 */
  presetSnapshot: Preset;
  partySnapshot: {
    supplier: Record<string, string> | null;
    client: Record<string, string> | null;
  };
  terms: Record<string, unknown>;
  notes: string | null;
  groups: { name: string }[];
  lines: DocumentLine[];
  /** 가산 항목. rate 는 % */
  surcharges: { key: string; label: string; rate: number; amount: number }[];
  amounts: DocumentAmounts;
  /** 공유 링크 상태. 공유하지 않았으면 null */
  share: ShareInfo | null;
  /** 이 문서를 변환해 만든 원본 (상세 조회에서만) */
  source: RelatedDocument | null;
  /** 이 문서로 만든 거래명세서·청구서 (상세 조회에서만) */
  derived: RelatedDocument[];
  createdAt: string;
  updatedAt: string;
}

/** 공유 링크. 주소는 /s/{token} */
export interface ShareInfo {
  token: string;
  sharedAt: string;
  /** 받는 사람이 처음·마지막으로 연 시각. 아직이면 null (작성자 본인이 연 것은 세지 않는다) */
  firstViewedAt: string | null;
  lastViewedAt: string | null;
}

/** 공유 링크로 보는 문서. 받는 사람에게 필요한 내용만 있다 */
export type SharedDocument = Omit<
  DocumentResponse,
  | "id"
  | "status"
  | "profileId"
  | "clientId"
  | "share"
  | "source"
  | "derived"
  | "createdAt"
  | "updatedAt"
> & {
  /** 문서 주인에게 무료 제한이 걸리는지. true 면 PDF 처럼 아래 문구를 보이고 로고를 뺀다 (공유 링크 응답에만 있다) */
  freeLimits?: boolean;
};

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
  /** 공유 링크가 켜져 있는지 */
  shared: boolean;
  /** 받는 사람이 공유 링크를 처음 연 시각 */
  firstViewedAt: string | null;
}

/** 목록 응답. page 는 0부터 */
export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
