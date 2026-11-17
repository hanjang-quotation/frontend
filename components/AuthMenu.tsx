"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type Me } from "@/lib/api/client";

// 헤더 오른쪽의 로그인 상태. 세션 쿠키는 HttpOnly 라서 브라우저에서 /api/me 를 불러 확인한다.
// undefined = 확인 중, null = 로그인 안 함
export default function AuthMenu() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null | undefined>(undefined);

  useEffect(() => {
    api.me().then(setMe, () => setMe(null));
  }, []);

  async function logout() {
    try {
      await api.logout();
    } finally {
      setMe(null);
      router.push("/");
    }
  }

  if (me === undefined) {
    return <span className="w-16" aria-hidden />;
  }

  if (me === null) {
    return (
      <Link
        href="/login"
        className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
      >
        로그인
      </Link>
    );
  }

  return (
    <>
      <span className="text-slate-900">{me.name ?? "회원"} 님</span>
      <button
        type="button"
        onClick={logout}
        className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
      >
        로그아웃
      </button>
    </>
  );
}
