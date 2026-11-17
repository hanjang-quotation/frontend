import type { Preset } from "./types";

// 인테리어·시공. 공종별로 품목을 묶어 소계를 내고, 단가는 자재·노무로 나눠 받는다.
// 공과잡비·기업이윤은 품목 합계에 비율로 더한다. 기본 세금은 부가세 별도.
// 백엔드의 V8__seed_construction_preset.sql (construction v1)과 내용이 같아야 한다.
export const constructionPreset: Preset = {
  code: "construction",
  name: "인테리어·시공",
  titlePlaceholder: "예: ○○아파트 32평 전체 리모델링",
  columns: [
    {
      key: "name",
      label: "품명",
      type: "text",
      required: true,
      placeholder: "예: 천장 석고보드 시공",
    },
    {
      key: "description",
      label: "규격",
      type: "text",
      placeholder: "예: 9.5T 2겹",
    },
    { key: "quantity", label: "수량", type: "number", default: 1 },
    {
      key: "unit",
      label: "단위",
      type: "select",
      options: ["㎡", "m", "평", "개", "EA", "식", "인"],
    },
    {
      key: "materialPrice",
      label: "자재 단가",
      type: "money",
      partOf: "unitPrice",
    },
    {
      key: "laborPrice",
      label: "노무 단가",
      type: "money",
      partOf: "unitPrice",
    },
    {
      key: "unitPrice",
      label: "단가",
      type: "formula",
      formula: "materialPrice + laborPrice",
    },
    {
      key: "amount",
      label: "금액",
      type: "formula",
      formula: "quantity * unitPrice",
    },
  ],
  termFields: [
    {
      key: "site",
      label: "현장 주소",
      type: "text",
      placeholder: "예: ○○아파트 101동 1001호",
    },
    {
      key: "area",
      label: "면적",
      type: "text",
      placeholder: "예: 32평 (전용 84㎡)",
    },
    { key: "startDate", label: "착공 예정일", type: "date" },
    {
      key: "period",
      label: "공사 기간",
      type: "text",
      placeholder: "예: 약 3주",
    },
    {
      key: "paymentTerms",
      label: "결제 조건",
      type: "select",
      options: [
        "계약금 30% · 중도금 40% · 잔금 30%",
        "계약금 10% · 착공 시 40% · 잔금 50%",
        "완료 후 일시불",
      ],
    },
    {
      key: "warranty",
      label: "하자 보수",
      type: "text",
      placeholder: "예: 준공 후 1년",
    },
  ],
  taxModes: ["VAT_10", "NONE"],
  defaultTaxMode: "VAT_10",
  useGroups: true,
  groupLabel: "공종",
  groupOptions: [
    "철거",
    "설비",
    "전기",
    "목공",
    "타일",
    "도장",
    "도배",
    "바닥",
    "가구",
    "청소",
  ],
  surcharges: [
    { key: "overhead", label: "공과잡비" },
    { key: "profit", label: "기업이윤" },
  ],
  printTemplate: "basic-a4",
};
