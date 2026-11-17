// 업종 설정(프리셋) 형식. 백엔드 presets.config 와 같은 구조다. (TECH_SPEC 7장)

import type { TaxMode } from "@/lib/calc";

export type ColumnType = "text" | "number" | "money" | "select" | "formula";
export type TermFieldType = "text" | "number" | "date" | "select";

export interface PresetColumn {
  key: string;
  label: string;
  type: ColumnType;
  required?: boolean;
  default?: string | number;
  options?: string[];
  formula?: string;
}

export interface PresetTermField {
  key: string;
  label: string;
  type: TermFieldType;
  default?: string | number;
  options?: string[];
}

export interface Preset {
  code: string;
  name: string;
  columns: PresetColumn[];
  termFields: PresetTermField[];
  taxModes: TaxMode[];
  defaultTaxMode: TaxMode;
  useGroups: boolean;
  printTemplate: string;
}

/** GET /api/presets 목록의 한 줄 */
export interface PresetSummary {
  code: string;
  name: string;
}
