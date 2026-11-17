// 인테리어·시공 소개 페이지(/construction)에 보여 줄 예시 견적서. 작성 화면 미리보기와 같은 컴포넌트로 그린다.

import type { DocumentForm } from "@/lib/document/form";
import type { PartyView } from "@/lib/party/types";

export const constructionSampleForm: DocumentForm = {
  profileId: null,
  title: "○○아파트 32평 부분 리모델링",
  issueDate: "2026-11-20",
  validUntil: "2026-12-05",
  client: {
    id: null,
    name: "홍길동",
    contactName: "",
    phone: "010-9876-5432",
    email: "",
    businessNo: "",
    address: "",
  },
  terms: {
    site: "○○아파트 101동 1001호",
    area: "32평 (전용 84㎡)",
    startDate: "2026-12-07",
    period: "약 3주",
    paymentTerms: "계약금 30% · 중도금 40% · 잔금 30%",
    warranty: "준공 후 1년",
  },
  taxMode: "VAT_10",
  discount: "",
  surcharges: { overhead: "5", profit: "10" },
  notes: "현장 확인 후 수량이 달라지면 다시 안내드립니다.",
  groups: [
    { id: 1, name: "철거" },
    { id: 2, name: "목공" },
    { id: 3, name: "도장" },
  ],
  lines: [
    {
      id: 1,
      groupId: 1,
      name: "주방 상부장 철거",
      description: "폐기물 처리 포함",
      quantity: "1",
      unit: "식",
      unitPrice: "",
      extra: { materialPrice: "50,000", laborPrice: "250,000" },
    },
    {
      id: 2,
      groupId: 2,
      name: "천장 석고보드",
      description: "9.5T 2겹",
      quantity: "30",
      unit: "㎡",
      unitPrice: "",
      extra: { materialPrice: "25,000", laborPrice: "40,000" },
    },
    {
      id: 3,
      groupId: 2,
      name: "걸레받이",
      description: "MDF 60mm",
      quantity: "40",
      unit: "m",
      unitPrice: "",
      extra: { materialPrice: "12,000", laborPrice: "20,500" },
    },
    {
      id: 4,
      groupId: 3,
      name: "벽 도장",
      description: "친환경 수성 페인트 2회",
      quantity: "50",
      unit: "㎡",
      unitPrice: "",
      extra: { materialPrice: "8,000", laborPrice: "7,000" },
    },
  ],
};

export const constructionSampleSupplier: PartyView = {
  name: "한장 인테리어",
  details: "김한장 · 010-1234-5678 · hello@example.com",
  bank: "국민은행 123456-01-234567 김한장",
};
