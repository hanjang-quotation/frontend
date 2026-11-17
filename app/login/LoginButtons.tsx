"use client";

import { rememberReturnPath } from "@/lib/auth";

// 소셜 로그인 버튼. 누르기 직전에 로그인 뒤 돌아갈 곳(?next, 없으면 내 문서)을 쿠키에 적어 둔다.
// 페이지 이동이 필요하므로 <Link> 가 아니라 <a> 를 쓴다.
// 주소의 ?next 는 누르는 순간에만 필요하므로 useSearchParams 대신 window.location 을 읽는다.
export default function LoginButtons() {
  const remember = () =>
    rememberReturnPath(
      new URLSearchParams(window.location.search).get("next") ?? "/documents",
    );

  return (
    <div className="mt-6 space-y-3">
      <a
        href="/api/oauth2/authorization/kakao"
        onClick={remember}
        className="block rounded-md bg-[#FEE500] px-4 py-2.5 text-sm font-medium text-ink"
      >
        카카오로 계속하기
      </a>
      <a
        href="/api/oauth2/authorization/google"
        onClick={remember}
        className="block rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-ink hover:bg-slate-50"
      >
        구글로 계속하기
      </a>
    </div>
  );
}
