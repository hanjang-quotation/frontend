// 엑셀에서 복사한 품목 칸을 붙여넣어 여러 줄을 한 번에 채운다.
// 엑셀은 복사하면 칸은 탭, 줄은 줄바꿈으로 나눈 글자가 된다. 열 순서가 사람마다 달라서 어림으로 나눈다:
//   - 맨 앞의 번호(No)는 버린다
//   - 글자 칸: 처음 것은 품명, 다음은 규격. 단위처럼 짧은 글자(업종의 단위 목록, 또는 두 글자 이하)는 단위
//   - 숫자 칸: 단가를 나눠 받는 업종(시공)은 수량, 자재 단가, 노무 단가 순, 그 밖은 수량, 단가 순 (뒤의 금액은 버린다).
//     숫자가 하나뿐이면 단가로 보고 수량은 1
//   - 숫자가 없고 "품명·수량·단가" 같은 글자만 있는 줄은 표 머리로 보고 버린다
// 넣기 전에 화면에서 결과를 보여 주고 사용자가 확인한다.

import type { Preset } from "@/lib/preset/types";
import { pricePartsOf, unitOptionsOf, withCommas } from "./form";

export interface PastedRow {
  name: string;
  description: string;
  quantity: string;
  unit: string;
  /** 단가 (단가를 나눠 받는 업종은 쓰지 않는다). 쉼표가 들어간 글자 */
  unitPrice: string;
  /** 단가를 나눠 받는 칸 (예: materialPrice, laborPrice) */
  parts: Record<string, string>;
}

const HEADER_WORDS =
  /^(no|번호|품명|항목|작업 ?항목|규격|사양|내용|수량|단위|단가|금액|자재|노무|비고)/i;

/** 숫자 칸: 1,000 / 1000원 / 1.5 */
function numberOf(cell: string): string | null {
  const cleaned = cell.replace(/[,\s원]/g, "");
  return /^\d+(\.\d+)?$/.test(cleaned) ? cleaned : null;
}

export function parsePasted(text: string, preset: Preset): PastedRow[] {
  const parts = pricePartsOf(preset).map((c) => c.key);
  const units = new Set(unitOptionsOf(preset));
  const rows: PastedRow[] = [];

  for (const raw of text.split(/\r?\n/)) {
    const cells = raw.split("\t").map((c) => c.trim());
    if (cells.every((c) => c === "")) continue;

    const nums: string[] = [];
    const texts: string[] = [];
    cells.forEach((cell, i) => {
      if (cell === "") return;
      const n = numberOf(cell);
      // 맨 앞 칸의 정수는 번호(No)로 본다 (뒤에 품명이 있을 때)
      if (n !== null && i === 0 && /^\d+$/.test(n) && cells.length > 1) return;
      if (n !== null) nums.push(n);
      else texts.push(cell);
    });

    // 표 머리 줄
    if (nums.length === 0 && texts.some((t) => HEADER_WORDS.test(t))) continue;
    if (texts.length === 0) continue;

    const name = texts[0];
    let description = "";
    let unit = "";
    for (const t of texts.slice(1)) {
      if (!unit && (units.has(t) || t.length <= 2)) unit = t;
      else if (!description) description = t;
    }

    const row: PastedRow = {
      name: name.slice(0, 200),
      description: description.slice(0, 2000),
      quantity: "1",
      unit: unit.slice(0, 20),
      unitPrice: "",
      parts: {},
    };
    if (parts.length > 0) {
      // 수량 + 나눠 받는 단가들. 숫자가 그보다 적으면 수량은 1 로 보고 앞에서부터 단가
      const withQuantity = nums.length >= parts.length + 1;
      if (withQuantity) row.quantity = nums[0];
      const prices = withQuantity ? nums.slice(1) : nums;
      parts.forEach((key, i) => {
        row.parts[key] = prices[i] ? withCommas(prices[i]) : "";
      });
    } else if (nums.length >= 2) {
      row.quantity = nums[0];
      row.unitPrice = withCommas(nums[1]);
    } else if (nums.length === 1) {
      row.unitPrice = withCommas(nums[0]);
    }
    rows.push(row);
  }
  return rows.slice(0, 200);
}
