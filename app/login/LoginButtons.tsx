"use client";

import { useSyncExternalStore } from "react";
import {
  readLastProvider,
  rememberReturnPath,
  subscribeLastProvider,
  type Provider,
} from "@/lib/auth";

// 소셜 로그인 버튼. 누르기 직전에 로그인 뒤 돌아갈 곳(?next, 없으면 내 문서)을 쿠키에 적어 둔다.
// 페이지 이동이 필요하므로 <Link> 가 아니라 <a> 를 쓴다.
// 주소의 ?next 는 누르는 순간에만 필요하므로 useSearchParams 대신 window.location 을 읽는다.
//
// 카카오와 구글은 서로 다른 계정이다. 이 브라우저에서 마지막으로 로그인한 쪽에 "최근에 쓴 로그인"을 붙여
// 다른 쪽으로 새로 가입해 "견적서가 사라졌다"고 느끼는 일을 줄인다. 미리 만든 화면에는 표시 없이 나간다.
const BUTTONS: {
  provider: Provider;
  href: string;
  label: string;
  className: string;
}[] = [
  {
    provider: "KAKAO",
    href: "/api/oauth2/authorization/kakao",
    label: "카카오로 계속하기",
    className: "bg-[#FEE500] text-ink",
  },
  {
    provider: "GOOGLE",
    href: "/api/oauth2/authorization/google",
    label: "구글로 계속하기",
    className: "border border-slate-300 text-ink hover:bg-slate-50",
  },
];

export default function LoginButtons() {
  const last = useSyncExternalStore(
    subscribeLastProvider,
    readLastProvider,
    () => null,
  );

  const remember = () =>
    rememberReturnPath(
      new URLSearchParams(window.location.search).get("next") ?? "/documents",
    );

  return (
    <>
      <div className="mt-6 space-y-3">
        {BUTTONS.map((b) => (
          <a
            key={b.provider}
            href={b.href}
            onClick={remember}
            className={`relative block rounded-md px-4 py-2.5 text-sm font-medium ${b.className} ${last === b.provider ? "ring-2 ring-pen ring-offset-2" : ""}`}
          >
            {b.label}
            {last === b.provider && (
              <span className="absolute -top-2.5 right-3 rounded-full bg-pen px-2 py-0.5 text-[11px] font-medium text-white">
                최근에 쓴 로그인
              </span>
            )}
          </a>
        ))}
      </div>
      <p className="mt-4 rounded-md bg-desk px-3 py-2 text-left text-xs leading-relaxed text-slate-600">
        카카오와 구글은 서로 다른 계정입니다. 처음 가입한 방법으로 로그인해야
        작성한 견적서가 보입니다.
      </p>
    </>
  );
}
