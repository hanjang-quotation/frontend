// 입력란 자동 서식. 저장되는 값도 이 형식 그대로다.

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
