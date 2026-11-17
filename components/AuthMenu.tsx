"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type Me } from "@/lib/api/client";
import { AUTH_CHANGED, notifyAuthChanged } from "@/lib/auth";

// 헤더 오른쪽의 로그인 상태. 세션 쿠키는 HttpOnly 라서 브라우저에서 /api/me 를 불러 확인한다.
// 로그인했지만 약관에 동의하지 않았으면 동의 화면(/welcome)으로 보낸다 (약관·방침을 읽는 화면은 빼고).
// undefined = 확인 중, null = 로그인 안 함

/** 동의하지 않아도 볼 수 있는 화면 */
const OPEN_WITHOUT_AGREEMENT = ["/welcome", "/terms", "/privacy", "/login"];

export default function AuthMenu() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null | undefined>(undefined);

  useEffect(() => {
    const load = () =>
      api.me().then(
        (user) => {
          setMe(user);
          const path = window.location.pathname;
          if (user && !user.agreed && !OPEN_WITHOUT_AGREEMENT.includes(path)) {
            const next = encodeURIComponent(path + window.location.search);
            router.replace(`/welcome?next=${next}`);
          }
        },
        () => setMe(null),
      );
    load();
    window.addEventListener(AUTH_CHANGED, load);
    return () => window.removeEventListener(AUTH_CHANGED, load);
  }, [router]);

  async function logout() {
    try {
      await api.logout();
    } finally {
      setMe(null);
      notifyAuthChanged();
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
      <span className="text-ink">{me.name ?? "회원"} 님</span>
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
