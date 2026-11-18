// 내 정보(공급자)·거래처 API 형식. 백엔드 profile/dto, client/dto 와 같은 구조다. (TECH_SPEC 9.2, 9.3)

import type { TaxMode } from "@/lib/calc";

/** 내 정보 한 건. 주민등록번호는 받지 않는다 */
export interface Profile {
  id: number;
  name: string;
  representative: string | null;
  businessNo: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  bankName: string | null;
  bankAccount: string | null;
  bankHolder: string | null;
  /** 업태·종목 (거래명세서의 공급자 칸) */
  businessType: string | null;
  businessItem: string | null;
  /** 로고·도장 이미지 (GET /api/images/{id}) */
  logoImageId: number | null;
  stampImageId: number | null;
  /** 새 문서의 기본 세금 방식 */
  taxType: TaxMode;
  isDefault: boolean;
}

export interface ProfileRequest {
  name: string;
  representative?: string;
  businessNo?: string;
  address?: string;
  phone?: string;
  email?: string;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  businessType?: string;
  businessItem?: string;
  logoImageId?: number | null;
  stampImageId?: number | null;
  taxType?: TaxMode;
  /** true 면 이 내 정보를 기본으로 한다 */
  isDefault?: boolean;
}

/** 거래처 한 건. 상호 말고는 선택 */
export interface Client {
  id: number;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  businessNo: string | null;
  address: string | null;
  memo: string | null;
}

export interface ClientRequest {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  businessNo?: string;
  address?: string;
  memo?: string;
}

/** 견적서의 공급자·받는 분 칸에 보여 줄 값 (미리보기용) */
export interface PartyView {
  name: string | null;
  /** 대표자·사업자번호·담당자·연락처·이메일·주소를 " · " 로 이은 것 */
  details: string | null;
  /** 입금 계좌 */
  bank: string | null;
}

/** 내 정보·거래처·문서 스냅샷에서 표시에 쓰는 칸 */
export type PartyFields = Partial<
  Record<
    | "name"
    | "representative"
    | "businessNo"
    | "contactName"
    | "phone"
    | "email"
    | "address"
    | "bankName"
    | "bankAccount"
    | "bankHolder"
    | "businessType"
    | "businessItem",
    string | null
  >
> & {
  /** 로고·도장 이미지 id (내 정보, 문서의 공급자 스냅샷) */
  logoImageId?: number | null;
  stampImageId?: number | null;
};

/** 내 정보·거래처·문서 스냅샷을 미리보기 표시용으로 바꾼다 (백엔드 PdfView.party 와 같은 순서) */
export function partyView(p: PartyFields | null | undefined): PartyView {
  if (!p) return { name: null, details: null, bank: null };
  const join = (sep: string, values: (string | null | undefined)[]) => {
    const text = values
      .map((v) => v?.trim())
      .filter(Boolean)
      .join(sep);
    return text === "" ? null : text;
  };
  return {
    name: p.name?.trim() || null,
    details: join(" · ", [
      p.representative,
      p.businessNo,
      p.contactName,
      p.phone,
      p.email,
      p.address,
    ]),
    bank: join(" ", [p.bankName, p.bankAccount, p.bankHolder]),
  };
}
