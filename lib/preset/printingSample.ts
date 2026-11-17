// 인쇄·제작 소개 페이지(/printing)에 보여 줄 예시 견적서. 작성 화면 미리보기와 같은 컴포넌트로 그린다.

import type { DocumentForm } from "@/lib/document/form";
import type { PartyView } from "@/lib/party/types";

export const printingSampleForm: DocumentForm = {
  profileId: null,
  title: "신제품 홍보물 제작",
  issueDate: "2026-11-20",
  validUntil: "2026-12-04",
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
    dueDate: "2026-12-01",
    delivery: "택배",
    fileFormat: "AI, PDF (300dpi 이상)",
    proofs: "2",
    paymentTerms: "선입금",
  },
  taxMode: "VAT_10",
  discount: "",
  surcharges: {},
  notes: "시안 확정 후 제작에 들어갑니다. 제작 기간은 영업일 기준 3일입니다.",
  groups: [],
  lines: [
    {
      id: 1,
      groupId: null,
      name: "명함",
      description: "90×50mm",
      quantity: "1000",
      unit: "매",
      unitPrice: "60",
      extra: {
        paper: "스노우지 300g",
        printing: "양면 4도",
        finishing: "무광코팅",
      },
      options: [
        { quantity: "500", amount: "45,000" },
        { quantity: "2000", amount: "90,000" },
      ],
    },
    {
      id: 2,
      groupId: null,
      name: "전단지",
      description: "A4",
      quantity: "2000",
      unit: "매",
      unitPrice: "75",
      extra: { paper: "아트지 150g", printing: "양면 4도", finishing: "" },
      options: [{ quantity: "5000", amount: "300,000" }],
    },
    {
      id: 3,
      groupId: null,
      name: "X배너",
      description: "600×1800mm",
      quantity: "2",
      unit: "개",
      unitPrice: "35,000",
      extra: {
        paper: "PET 배너",
        printing: "단면 4도",
        finishing: "거치대 포함",
      },
      options: [],
    },
  ],
};

export const printingSampleSupplier: PartyView = {
  name: "한장 인쇄",
  details: "김한장 · 010-1234-5678 · hello@example.com",
  bank: "국민은행 123456-01-234567 김한장",
};
