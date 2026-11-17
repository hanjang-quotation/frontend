import type { Preset } from "./types";

// 인쇄·제작. 용지·인쇄·후가공은 품명 아래 한 줄로 보여 주고(display: "detail"),
// 품목마다 다른 수량의 가격(quantityOptions)을 함께 적을 수 있다. 합계는 본 수량으로만 계산한다.
// 백엔드의 V9__seed_printing_preset.sql (printing v1)과 내용이 같아야 한다.
export const printingPreset: Preset = {
  code: "printing",
  name: "인쇄·제작",
  titlePlaceholder: "예: 신제품 홍보물 제작",
  columns: [
    {
      key: "name",
      label: "품명",
      type: "text",
      required: true,
      placeholder: "예: 명함",
    },
    {
      key: "description",
      label: "규격",
      type: "text",
      placeholder: "예: 90×50mm",
    },
    {
      key: "paper",
      label: "용지",
      type: "text",
      display: "detail",
      placeholder: "예: 스노우지 300g",
    },
    {
      key: "printing",
      label: "인쇄",
      type: "select",
      display: "detail",
      options: ["단면 1도", "단면 4도", "양면 1도", "양면 4도"],
    },
    {
      key: "finishing",
      label: "후가공",
      type: "text",
      display: "detail",
      placeholder: "예: 무광코팅, 귀도리",
    },
    { key: "quantity", label: "수량", type: "number", default: 1 },
    {
      key: "unit",
      label: "단위",
      type: "select",
      options: ["매", "부", "권", "개", "장", "EA", "식"],
    },
    { key: "unitPrice", label: "단가", type: "money" },
    {
      key: "amount",
      label: "금액",
      type: "formula",
      formula: "quantity * unitPrice",
    },
    { key: "quantityOptions", label: "수량별 가격", type: "quantityOptions" },
  ],
  termFields: [
    { key: "dueDate", label: "납기일", type: "date" },
    {
      key: "delivery",
      label: "납품 방법",
      type: "select",
      options: ["택배", "퀵", "방문 수령", "직접 납품"],
    },
    {
      key: "fileFormat",
      label: "파일 형식",
      type: "text",
      placeholder: "예: AI, PDF (300dpi 이상)",
    },
    { key: "proofs", label: "시안 수정", type: "number", default: 2 },
    {
      key: "paymentTerms",
      label: "결제 조건",
      type: "select",
      options: ["선입금", "계약금 50% · 잔금 납품 시", "납품 후 일시불"],
    },
  ],
  taxModes: ["VAT_10", "NONE"],
  defaultTaxMode: "VAT_10",
  useGroups: false,
  printTemplate: "basic-a4",
};
