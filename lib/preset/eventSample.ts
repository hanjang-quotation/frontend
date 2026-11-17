// 행사·케이터링 소개 페이지(/event)에 보여 줄 예시 견적서. 작성 화면 미리보기와 같은 컴포넌트로 그린다.

import type { DocumentForm } from "@/lib/document/form";
import type { PartyView } from "@/lib/party/types";

export const eventSampleForm: DocumentForm = {
  profileId: null,
  title: "창립 10주년 기념 만찬",
  issueDate: "2026-11-20",
  validUntil: "2026-12-05",
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
    eventDate: "2026-12-12",
    eventTime: "18:00 ~ 21:00",
    venue: "본사 대강당",
    guests: "120",
    paymentTerms: "계약금 30% · 잔금 행사 후",
    cancellation: "행사 7일 전까지 무료 취소",
  },
  taxMode: "VAT_10",
  discount: "",
  surcharges: {},
  notes: "알레르기 등 식단 제한이 있으면 행사 5일 전까지 알려 주세요.",
  groups: [],
  lines: [
    {
      id: 1,
      groupId: null,
      name: "뷔페 (한식)",
      description: "메인 8종, 디저트 3종, 음료",
      quantity: "120",
      unit: "명",
      unitPrice: "35,000",
      extra: {},
    },
    {
      id: 2,
      groupId: null,
      name: "서빙 인력",
      description: "행사 3시간",
      quantity: "6",
      unit: "명",
      unitPrice: "90,000",
      extra: {},
    },
    {
      id: 3,
      groupId: null,
      name: "출장비",
      description: "",
      quantity: "1",
      unit: "명",
      unitPrice: "200,000",
      extra: {},
    },
  ],
};

export const eventSampleSupplier: PartyView = {
  name: "한장 케이터링",
  details: "김한장 · 010-1234-5678 · hello@example.com",
  bank: "국민은행 123456-01-234567 김한장",
};
