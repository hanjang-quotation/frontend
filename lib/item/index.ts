// 자주 쓰는 품목. 백엔드 item/dto 와 같은 구조이고, 업종(presetCode)별로 저장한다.
// 수량은 견적마다 달라 저장하지 않는다. extra 는 문서 행과 같은 형식이다.

import {
  detailColumnsOf,
  filledOptions,
  optionsColumnOf,
  parseNumber,
  pricePartsOf,
  withCommas,
  type LineForm,
} from "@/lib/document/form";
import type { Preset } from "@/lib/preset/types";

export interface SavedItem {
  id: number;
  presetCode: string;
  name: string;
  description: string | null;
  unit: string | null;
  /** 단가. 단가를 나눠 받는 업종은 나눈 칸의 합 */
  unitPrice: number;
  extra: Record<string, unknown>;
  updatedAt: string;
}

export interface SavedItemRequest {
  presetCode: string;
  name: string;
  description?: string | null;
  unit?: string | null;
  unitPrice?: number | null;
  extra?: Record<string, unknown>;
}

/** 작성 화면의 한 줄을 저장 요청으로 (수량은 빼고) */
export function itemRequestFromLine(
  line: LineForm,
  preset: Preset,
): SavedItemRequest {
  const parts = pricePartsOf(preset);
  const optionsColumn = optionsColumnOf(preset);
  const extra: Record<string, unknown> = {};
  for (const part of parts) {
    extra[part.key] = parseNumber(line.extra[part.key] ?? "");
  }
  for (const column of detailColumnsOf(preset)) {
    const value = (line.extra[column.key] ?? "").trim();
    if (value !== "") extra[column.key] = value;
  }
  if (optionsColumn) {
    extra[optionsColumn.key] = filledOptions(line).map((o) => ({
      quantity: parseNumber(o.quantity),
      amount: parseNumber(o.amount),
    }));
  }
  return {
    presetCode: preset.code,
    name: line.name.trim(),
    description: line.description.trim() || null,
    unit: line.unit || null,
    unitPrice: parts.length > 0 ? null : (parseNumber(line.unitPrice) ?? 0),
    extra,
  };
}

/** 저장된 품목으로 한 줄의 칸을 채운다 (수량·묶음은 그대로 둔다) */
export function linePatchFromItem(
  item: SavedItem,
  preset: Preset,
): Partial<LineForm> {
  const extra: Record<string, string> = {};
  for (const part of pricePartsOf(preset)) {
    const value = item.extra[part.key];
    extra[part.key] =
      value === undefined || value === null ? "" : withCommas(String(value));
  }
  for (const column of detailColumnsOf(preset)) {
    const value = item.extra[column.key];
    extra[column.key] =
      value === undefined || value === null ? "" : String(value);
  }
  const optionsColumn = optionsColumnOf(preset);
  const saved = optionsColumn ? item.extra[optionsColumn.key] : undefined;
  return {
    name: item.name,
    description: item.description ?? "",
    unit: item.unit ?? "",
    unitPrice: withCommas(String(item.unitPrice)),
    extra,
    options: Array.isArray(saved)
      ? (saved as { quantity: number; amount: number }[]).map((o) => ({
          quantity: String(o.quantity),
          amount: withCommas(String(o.amount)),
        }))
      : [],
  };
}
