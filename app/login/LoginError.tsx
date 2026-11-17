"use client";

import { useSearchParams } from "next/navigation";

// 백엔드가 소셜 로그인에 실패하면 /login?error 로 돌려보낸다.
export default function LoginError() {
  const searchParams = useSearchParams();
  if (!searchParams.has("error")) return null;

  return (
    <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
      로그인하지 못했습니다. 다시 시도해 주세요.
    </p>
  );
}
