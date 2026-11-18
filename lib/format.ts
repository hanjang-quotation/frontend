// 화면 표시용 서식과 입력란 자동 서식.

/** "2026-11-20" → "2026. 11. 20." */
export function formatDate(value: string): string {
  const [y, m, d] = value.split("-");
  return y && m && d ? `${y}. ${m}. ${d}.` : value;
}

/** 서버 시각(ISO) → "오후 3:12:05". 브라우저에서만 부른다 (보는 사람의 시간대) */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR");
}

/** 서버 시각(ISO) → 오늘이면 "오후 3:12", 아니면 "2026. 11. 17." */
export function formatDateTimeShort(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString("ko-KR");
}

// 아래는 입력란 자동 서식. 저장되는 값도 이 형식 그대로다.

/** 사업자등록번호 10자리 → 123-45-67890. 숫자 외 문자는 버린다. 입력하는 도중에도 부를 수 있다 */
export function formatBusinessNo(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}

/**
 * 전화번호에 하이픈을 넣는다. 숫자 외 문자는 버린다. 입력하는 도중에도 부를 수 있다.
 * 02-123-4567, 02-1234-5678, 031-123-4567, 010-1234-5678, 1588-1234
 */
export function formatPhone(value: string): string {
  const d = value.replace(/\D/g, "");

  if (d.startsWith("02")) {
    const s = d.slice(0, 10);
    if (s.length <= 2) return s;
    if (s.length <= 5) return `${s.slice(0, 2)}-${s.slice(2)}`;
    if (s.length <= 9) return `${s.slice(0, 2)}-${s.slice(2, 5)}-${s.slice(5)}`;
    return `${s.slice(0, 2)}-${s.slice(2, 6)}-${s.slice(6)}`;
  }

  // 전국 대표번호 (1588-1234 처럼 8자리)
  if (/^1[5-9]/.test(d)) {
    const s = d.slice(0, 8);
    return s.length <= 4 ? s : `${s.slice(0, 4)}-${s.slice(4)}`;
  }

  const s = d.slice(0, 11);
  if (s.length <= 3) return s;
  if (s.length <= 6) return `${s.slice(0, 3)}-${s.slice(3)}`;
  if (s.length <= 10) return `${s.slice(0, 3)}-${s.slice(3, 6)}-${s.slice(6)}`;
  return `${s.slice(0, 3)}-${s.slice(3, 7)}-${s.slice(7)}`;
}

const KOREAN_DIGITS = [
  "",
  "일",
  "이",
  "삼",
  "사",
  "오",
  "육",
  "칠",
  "팔",
  "구",
];
const KOREAN_SMALL_UNITS = ["", "십", "백", "천"];
const KOREAN_BIG_UNITS = ["", "만", "억", "조", "경"];

/**
 * 금액을 한글로: 5,060,000 → "오백육만". 십·백·천 앞에도 "일"을 붙인다 (1,100,000 → 일백일십만).
 * 백엔드 common/KoreanAmount.words 와 결과가 같아야 한다
 */
export function koreanAmount(amount: number): string {
  if (amount === 0) return "영";
  if (amount < 0) return `마이너스 ${koreanAmount(-amount)}`;
  let result = "";
  let rest = Math.floor(amount);
  for (let big = 0; rest > 0; big++) {
    const group = rest % 10_000;
    if (group > 0) {
      let text = "";
      for (let unit = 3; unit >= 0; unit--) {
        const digit = Math.floor(group / 10 ** unit) % 10;
        if (digit > 0) text += KOREAN_DIGITS[digit] + KOREAN_SMALL_UNITS[unit];
      }
      result = text + KOREAN_BIG_UNITS[big] + result;
    }
    rest = Math.floor(rest / 10_000);
  }
  return result;
}

/** 문서에 쓰는 꼴: "일금 오백육만원정" */
export function koreanAmountSentence(amount: number): string {
  return `일금 ${koreanAmount(amount)}원정`;
}
