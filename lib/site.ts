// 서비스·운영자 정보. 이용약관·개인정보처리방침·화면 아래쪽이 이 값을 쓴다.
// 서비스 이름은 "바로 한장". 운영자 정보는 출시 전에 여기 한 곳만 채운다.

export const SITE = {
  name: "바로 한장",
  /**
   * 사이트 주소 (끝에 / 없음). 검색엔진용 sitemap·robots 와 공유 미리보기에 쓴다.
   * 도메인을 사면 Vercel 환경 변수 NEXT_PUBLIC_SITE_URL 을 새 주소로 바꾼다
   */
  url: (
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://frontend-gamma-six-74.vercel.app"
  ).replace(/\/$/, ""),
  /** 무료 PDF·미리보기 아래 문구 (뒤에 사이트 주소가 붙는다). 백엔드 DocumentPdfService.BRAND_FOOTER 와 같아야 한다 */
  brandFooter: "바로 한장으로 작성했습니다",
  /** 요금 (결제는 아직 없다. 요금제 화면 /pricing) */
  price: { monthly: 6900, yearly: 59000 },
  /** 운영자(개인정보 보호책임자) 이름. 사업자등록 전이라 개인 이름. 등록하면 상호와 대표자로 바꾼다 */
  operator: "김유빈",
  /** 문의·개인정보 관련 연락처. 네이버 무료 메일. 도메인을 사면 @ 뒤를 바꾼다 */
  email: "hanjang-baro@hanjang-baro.by-works.net",
  /** 약관·개인정보처리방침 시행일. 백엔드 Agreements.VERSION 과 같아야 한다 */
  policyDate: "2026-11-20",
} as const;
