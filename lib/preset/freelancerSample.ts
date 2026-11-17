// 프리랜서 소개 페이지(/freelancer)에 보여 줄 예시 견적서. 작성 화면 미리보기와 같은 컴포넌트로 그린다.

import type { DocumentForm } from "@/lib/document/form";
import type { PartyView } from "@/lib/party/types";

export const freelancerSampleForm: DocumentForm = {
  profileId: null,
  title: "회사 소개 홈페이지 제작",
  issueDate: "2026-11-20",
  validUntil: "2026-12-20",
  client: {
    id: null,
    name: "가나다 주식회사",
    contactName: "홍길동",
    phone: "02-123-4567",
    email: "",
    businessNo: "",
    address: "",
  },
  terms: {
    revisions: "2",
    dueDate: "2026-12-31",
    paymentTerms: "선금 50% · 잔금 50%",
    deliverables: "디자인 원본(Figma), 반응형 웹사이트",
  },
  taxMode: "WITHHOLDING_3_3",
  discount: "",
  notes: "계약금 입금 후 작업을 시작합니다.",
  lines: [
    {
      id: 1,
      name: "메인 페이지 디자인",
      description: "PC·모바일",
      quantity: "1",
      unit: "식",
      unitPrice: "800,000",
    },
    {
      id: 2,
      name: "서브 페이지 디자인",
      description: "회사 소개, 서비스, 문의",
      quantity: "4",
      unit: "페이지",
      unitPrice: "150,000",
    },
    {
      id: 3,
      name: "퍼블리싱",
      description: "반응형 HTML·CSS",
      quantity: "5",
      unit: "페이지",
      unitPrice: "100,000",
    },
  ],
};

export const freelancerSampleSupplier: PartyView = {
  name: "한장 디자인",
  details: "김한장 · 010-1234-5678 · hello@example.com",
  bank: "국민은행 123456-01-234567 김한장",
};
