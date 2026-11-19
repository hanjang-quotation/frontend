"use client";

import Link from "next/link";

// 화면을 그리다 생긴 오류. 메뉴 줄(SiteHeader)은 서버 부품이라 여기서 쓰지 않고 간단히 보여 준다.
// 운영 환경에서는 오류 내용이 숨겨지므로 digest(서버 로그와 맞춰 볼 번호)만 보여 준다.
// 브라우저 콘솔에는 남기지 않는다 (방문자 브라우저에만 찍혀 운영자가 볼 수 없다)
export default function Error({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const digest =
    error instanceof Error && "digest" in error
      ? String((error as Error & { digest?: string }).digest ?? "")
      : "";

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-4 py-20">
        <h1 className="font-display text-3xl font-bold text-ink">
          화면을 보여 주지 못했습니다
        </h1>
        <p className="mt-3 text-slate-600">
          잠시 뒤에 다시 해 주세요. 계속되면 아래 번호와 함께 문의해 주세요.
        </p>
        {digest && (
          <p className="mt-2 font-mono text-xs text-slate-500">
            오류 번호 {digest}
          </p>
        )}
        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <button
            type="button"
            onClick={() => retry()}
            className="rounded-md bg-pen px-4 py-2 font-medium text-white hover:bg-pen-deep"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="rounded-md border border-rule bg-paper px-4 py-2 font-medium text-ink hover:border-slate-400"
          >
            첫 화면으로
          </Link>
        </div>
      </div>
    </main>
  );
}
