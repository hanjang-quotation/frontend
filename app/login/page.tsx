import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import LoginButtons from "./LoginButtons";
import LoginError from "./LoginError";

export const metadata: Metadata = { title: "로그인" };

// 로그인 버튼은 백엔드의 소셜 로그인 시작 주소로 이동한다.
// 로그인에 성공하면 백엔드가 ?next 경로(없으면 메인)로, 약관에 동의하지 않았으면 /welcome 으로 보낸다.
export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-rule bg-paper p-8 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">로그인</h1>
        <p className="mt-2 text-sm text-slate-500">
          비밀번호 없이 소셜 계정으로 시작하세요.
        </p>
        {/* 주소의 ?error 를 읽으므로 Suspense 로 감싼다 (Next 16 cacheComponents) */}
        <Suspense>
          <LoginError />
        </Suspense>
        <LoginButtons />
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
