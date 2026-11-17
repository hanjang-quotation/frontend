// 업종 설정(프리셋) 형식. 백엔드 presets.config 와 같은 구조다. (TECH_SPEC 7장)

import type { TaxMode } from "@/lib/calc";

export type ColumnType =
  | "text"
  | "number"
  | "money"
  | "select"
  | "formula"
  /** 수량별 가격 [{ quantity, amount }]. 품목 아래에 보여 주기만 하고 합계에는 들어가지 않는다 */
  | "quantityOptions";
export type TermFieldType = "text" | "number" | "date" | "select";

export interface PresetColumn {
  key: string;
  label: string;
  type: ColumnType;
  required?: boolean;
  default?: string | number;
  options?: string[];
  formula?: string;
  /** 입력 칸의 예시 문구 */
  placeholder?: string;
  /** "unitPrice" 면 단가를 나눠 받는 열. 단가 = 그 열들의 합 (예: 시공의 자재·노무 단가) */
  partOf?: "unitPrice";
  /** "detail" 이면 품명 아래 한 줄에 규격과 함께 " · " 로 이어 보여 준다 (예: 인쇄의 용지·인쇄·후가공) */
  display?: "detail";
}

export interface PresetTermField {
  key: string;
  label: string;
  type: TermFieldType;
  default?: string | number;
  options?: string[];
  /** 입력 칸의 예시 문구 */
  placeholder?: string;
}

export interface Preset {
  code: string;
  name: string;
  columns: PresetColumn[];
  termFields: PresetTermField[];
  taxModes: TaxMode[];
  defaultTaxMode: TaxMode;
  /** 품목을 묶음(예: 시공의 공종)으로 나눠 묶음마다 소계를 보여 준다 */
  useGroups: boolean;
  /** 묶음 이름 (예: "공종") */
  groupLabel?: string;
  /** 묶음 이름 추천 목록 */
  groupOptions?: string[];
  /** 가산 항목. 소계 × 비율(%)을 공급 금액에 더한다 (예: 공과잡비·기업이윤) */
  surcharges?: PresetSurcharge[];
  /** 건명 입력 칸의 예시 */
  titlePlaceholder?: string;
  printTemplate: string;
}

export interface PresetSurcharge {
  key: string;
  label: string;
}

/** GET /api/presets 목록의 한 줄 */
export interface PresetSummary {
  code: string;
  name: string;
}
