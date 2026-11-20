// 서비스·운영자 정보. 이용약관·개인정보처리방침·화면 아래쪽이 이 값을 쓴다.
// 서비스 이름은 "바로 한장". 운영자 정보는 출시 전에 여기 한 곳만 채운다.

export const SITE = {
  name: "바로 한장",
  /**
   * 사이트 주소 (끝에 / 없음). 검색엔진용 sitemap·robots 와 공유 미리보기에 쓴다.
   * 기본값이 실제 주소다. 주소가 바뀌면 여기를 고치거나 Render 정적 사이트 환경 변수 NEXT_PUBLIC_SITE_URL 로 준다
   */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://barohanjang.com").replace(
    /\/$/,
    "",
  ),
  /**
   * AI 로 가져오기를 화면에서 열지. 서버도 따로 꺼 둔다 (Dockerfile 의 AI_IMPORT_ENABLED=false).
   * 유료 AI API 로 바꾼 뒤 둘 다 켠다
   */
  aiImportOpen: true,
  /** 운영자(개인정보 보호책임자) 이름. 사업자등록 전이라 개인 이름. 등록하면 상호와 대표자로 바꾼다 */
  operator: "김유빈",
  /** 문의·개인정보 관련 연락처. Cloudflare Email Routing 으로 받아 개인 메일로 넘긴다 (받기 전용, 2026-11-20) */
  email: "help@barohanjang.com",
  /** 약관·개인정보처리방침 시행일. 백엔드 Agreements.VERSION 과 같아야 한다 */
  policyDate: "2026-11-21",
} as const;
