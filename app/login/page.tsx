import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "로그인" };

// 로그인 버튼은 백엔드의 소셜 로그인 시작 주소로 이동한다.
// 페이지 이동이 필요하므로 <Link> 가 아니라 <a> 를 쓴다.
// 백엔드 쪽 처리는 1단계(소셜 로그인)에서 만든다.
export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">로그인</h1>
        <p className="mt-2 text-sm text-slate-500">
          비밀번호 없이 소셜 계정으로 시작하세요.
        </p>
        <div className="mt-6 space-y-3">
          <a
            href="/api/oauth2/authorization/kakao"
            className="block rounded-md bg-[#FEE500] px-4 py-2.5 text-sm font-medium text-slate-900"
          >
            카카오로 계속하기
          </a>
          <a
            href="/api/oauth2/authorization/google"
            className="block rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            구글로 계속하기
          </a>
        </div>
        <Link
          href="/"
          className="mt-6 inline-block text-xs text-slate-500 hover:text-slate-700"
        >
          처음으로
        </Link>
      </div>
    </main>
  );
}
