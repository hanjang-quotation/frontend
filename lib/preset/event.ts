import type { Preset } from "./types";

// 행사·케이터링. 인원 × 1인 단가, 출장비·장비는 별도 줄. 사업자 거래가 많아 기본 세금은 부가세 별도.
// 백엔드의 V8__seed_construction_preset.sql (event v2)과 내용이 같아야 한다.
export const eventPreset: Preset = {
  code: "event",
  name: "행사·케이터링",
  titlePlaceholder: "예: 창립 10주년 기념 만찬",
  columns: [
    {
      key: "name",
      label: "항목",
      type: "text",
      required: true,
      placeholder: "예: 뷔페 (한식)",
    },
    {
      key: "description",
      label: "구성·내용",
      type: "text",
      placeholder: "예: 메인 8종, 디저트 3종",
    },
    { key: "quantity", label: "수량", type: "number", default: 1 },
    {
      key: "unit",
      label: "단위",
      type: "select",
      options: ["명", "식", "인분", "개", "회", "대", "시간"],
    },
    { key: "unitPrice", label: "단가", type: "money" },
    {
      key: "amount",
      label: "금액",
      type: "formula",
      formula: "quantity * unitPrice",
    },
  ],
  termFields: [
    { key: "eventDate", label: "행사일", type: "date" },
    {
      key: "eventTime",
      label: "행사 시간",
      type: "text",
      placeholder: "예: 18:00 ~ 21:00",
    },
    {
      key: "venue",
      label: "장소",
      type: "text",
      placeholder: "예: ○○호텔 그랜드볼룸",
    },
    {
      key: "guests",
      label: "예상 인원",
      type: "number",
      placeholder: "예: 120",
    },
    {
      key: "paymentTerms",
      label: "결제 조건",
      type: "select",
      options: [
        "계약금 30% · 잔금 행사 후",
        "계약금 50% · 잔금 행사 당일",
        "행사 후 일시불",
      ],
    },
    {
      key: "cancellation",
      label: "취소·변경",
      type: "text",
      placeholder: "예: 행사 7일 전까지 무료 취소",
    },
  ],
  taxModes: ["VAT_10", "NONE", "WITHHOLDING_3_3"],
  defaultTaxMode: "VAT_10",
  useGroups: false,
  printTemplate: "basic-a4",
};
