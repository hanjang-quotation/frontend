// 서비스·운영자 정보. 이용약관·개인정보처리방침·화면 아래쪽이 이 값을 쓴다.
// 서비스 이름은 "바로 한장". 운영자 정보는 출시 전에 여기 한 곳만 채운다.

export const SITE = {
  name: "바로 한장",
  /** 운영자(개인정보 보호책임자) 이름 */
  operator: "[운영자 이름 — 출시 전에 채움]",
  /** 문의·개인정보 관련 연락처. 네이버 무료 메일. 도메인을 사면 @ 뒤를 바꾼다 */
  email: "hanjang-baro@hanjang-baro.by-works.net",
  /** 약관·개인정보처리방침 시행일. 백엔드 Agreements.VERSION 과 같아야 한다 */
  policyDate: "2026-11-17",
} as const;
