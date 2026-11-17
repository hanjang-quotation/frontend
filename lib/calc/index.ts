// 합계 계산. 백엔드 calc 패키지(DocumentCalculator)와 규칙이 같아야 한다. (TECH_SPEC 8장)
// 화면 미리보기용이며, 저장할 때는 서버가 다시 계산한 값이 기준이다.

export type TaxMode = "WITHHOLDING_3_3" | "VAT_10" | "NONE";

export const TAX_MODE_LABELS: Record<TaxMode, string> = {
  WITHHOLDING_3_3: "3.3% 공제 (사업소득)",
  VAT_10: "부가세 10% 별도",
  NONE: "세금 표시 안 함",
};

/** 세율은 1000분율로 둔다. 33 = 3.3%, 100 = 10% */
const WITHHOLDING_PER_MILLE = 33;
const VAT_PER_MILLE = 100;

/**
 * 세금의 원 미만 처리 방식. 세무 기준을 확인하기 전까지는 절사(버림)로 둔다.
 * 바꿀 때는 이 함수와 백엔드 DocumentCalculator.roundTax 를 함께 고친다.
 */
function roundTax(supply: number, perMille: number): number {
  return Math.floor((supply * perMille) / 1000);
}

export interface LineInput {
  /** 소수 둘째 자리까지 */
  quantity: number;
  /** 원 단위 정수 */
  unitPrice: number;
}

export interface Totals {
  lineAmounts: number[];
  subtotalAmount: number;
  discountAmount: number;
  /** 공급 금액 = 소계 − 할인 */
  supplyAmount: number;
  /** 부가세 또는 공제액 */
  taxAmount: number;
  /** 합계(청구 금액) */
  totalAmount: number;
  /** 실수령액 */
  netAmount: number;
}

/** 행 금액 = 수량 × 단가, 원 미만 반올림. 소수 오차를 피하려고 정수로 바꿔 계산한다. */
export function lineAmount(quantity: number, unitPrice: number): number {
  const q = Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
  const p = Number.isFinite(unitPrice) && unitPrice > 0 ? unitPrice : 0;
  const hundredths = Math.round(q * 100);
  return Math.floor((hundredths * Math.round(p) + 50) / 100);
}

export function calculateTotals(
  lines: LineInput[],
  discountAmount: number,
  taxMode: TaxMode,
): Totals {
  const lineAmounts = lines.map((l) => lineAmount(l.quantity, l.unitPrice));
  const subtotalAmount = lineAmounts.reduce((sum, a) => sum + a, 0);
  const discount = Math.min(
    Math.max(0, Math.round(discountAmount || 0)),
    subtotalAmount,
  );
  const supplyAmount = subtotalAmount - discount;

  let taxAmount = 0;
  let totalAmount = supplyAmount;
  let netAmount = supplyAmount;

  if (taxMode === "WITHHOLDING_3_3") {
    taxAmount = roundTax(supplyAmount, WITHHOLDING_PER_MILLE);
    netAmount = supplyAmount - taxAmount;
  } else if (taxMode === "VAT_10") {
    taxAmount = roundTax(supplyAmount, VAT_PER_MILLE);
    totalAmount = supplyAmount + taxAmount;
    netAmount = totalAmount;
  }

  return {
    lineAmounts,
    subtotalAmount,
    discountAmount: discount,
    supplyAmount,
    taxAmount,
    totalAmount,
    netAmount,
  };
}

export function formatWon(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}
