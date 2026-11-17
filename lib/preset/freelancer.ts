import type { Preset } from "./types";

// 로그인 전에도 작성 화면을 쓸 수 있도록 업종 설정을 프론트에도 둔다.
// 백엔드의 최신 버전(V8__seed_construction_preset.sql 의 freelancer v3)과 내용이 같아야 한다.
export const freelancerPreset: Preset = {
  code: "freelancer",
  name: "프리랜서 (디자인·개발)",
  titlePlaceholder: "예: 회사 소개 홈페이지 제작",
  columns: [
    {
      key: "name",
      label: "작업 항목",
      type: "text",
      required: true,
      placeholder: "예: 메인 페이지 디자인",
    },
    {
      key: "description",
      label: "작업 범위",
      type: "text",
      placeholder: "예: PC·모바일",
    },
    { key: "quantity", label: "수량", type: "number", default: 1 },
    {
      key: "unit",
      label: "단위",
      type: "select",
      options: ["식", "건", "페이지", "시간", "일"],
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
    { key: "revisions", label: "수정 횟수", type: "number", default: 2 },
    { key: "dueDate", label: "납기일", type: "date" },
    {
      key: "paymentTerms",
      label: "결제 조건",
      type: "select",
      options: ["완료 후 일시불", "선금 50% · 잔금 50%"],
    },
    {
      key: "deliverables",
      label: "납품물",
      type: "text",
      placeholder: "예: 디자인 원본, 반응형 웹사이트",
    },
  ],
  taxModes: ["WITHHOLDING_3_3", "VAT_10", "NONE"],
  defaultTaxMode: "WITHHOLDING_3_3",
  useGroups: false,
  printTemplate: "basic-a4",
};
