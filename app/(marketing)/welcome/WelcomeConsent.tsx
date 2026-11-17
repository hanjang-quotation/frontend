"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api/client";
import { errorMessages } from "@/lib/api/errors";
import { notifyAuthChanged, safePath } from "@/lib/auth";

// 첫 로그인 동의 화면. 이용약관과 개인정보 수집·이용 동의는 둘 다 필수다.
// 개인정보 수집·이용 동의에는 항목·목적·보유 기간·거부할 권리를 적는다 (개인정보 보호법 15조).
// 동의하면 ?next 경로(로그인 전에 있던 화면)로 보낸다.
export default function WelcomeConsent() {
  const router = useRouter();
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string[] | null>(null);

  async function agree() {
    setBusy(true);
    setError(null);
    try {
      await api.agree();
      notifyAuthChanged();
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(safePath(next));
    } catch (e) {
      setError(errorMessages(e, "동의를 저장하지 못했습니다."));
      setBusy(false);
    }
  }

  async function decline() {
    try {
      await api.logout();
    } finally {
      notifyAuthChanged();
      router.replace("/");
    }
  }

  const all = terms && privacy;

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-ink">반갑습니다</h1>
      <p className="mt-2 text-sm text-slate-600">
        서비스를 쓰려면 아래 두 가지에 동의해 주세요.
      </p>

      <div className="mt-6 space-y-4 rounded-xl border border-rule bg-paper p-5 text-sm">
        <label className="flex items-center gap-2 border-b border-slate-100 pb-3 font-semibold text-ink">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={all}
            onChange={(e) => {
              setTerms(e.target.checked);
              setPrivacy(e.target.checked);
            }}
          />
          모두 동의
        </label>

        <div>
          <label className="flex items-center gap-2 text-ink">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
            />
            [필수] 이용약관 동의
            <Link
              href="/terms"
              target="_blank"
              className="ml-auto text-xs text-slate-500 underline"
            >
              전문 보기
            </Link>
          </label>
        </div>

        <div>
          <label className="flex items-center gap-2 text-ink">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={privacy}
              onChange={(e) => setPrivacy(e.target.checked)}
            />
            [필수] 개인정보 수집·이용 동의
            <Link
              href="/privacy"
              target="_blank"
              className="ml-auto text-xs text-slate-500 underline"
            >
              처리방침 보기
            </Link>
          </label>
          <table className="mt-2 w-full text-xs text-slate-600">
            <tbody className="[&_td]:border [&_td]:border-rule [&_td]:p-2 [&_th]:border [&_th]:border-rule [&_th]:bg-slate-50 [&_th]:p-2 [&_th]:text-left [&_th]:font-medium">
              <tr>
                <th className="w-24">수집 항목</th>
                <td>
                  소셜 계정의 회원 식별값, 이름(닉네임), 이메일(구글).
                  서비스에서 직접 입력한 내 정보·거래처·견적서 내용
                </td>
              </tr>
              <tr>
                <th>목적</th>
                <td>회원 식별과 로그인, 견적서 작성·저장·PDF 제공</td>
              </tr>
              <tr>
                <th>보유 기간</th>
                <td>회원 탈퇴 시까지 (탈퇴하면 바로 삭제)</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-xs text-slate-500">
            동의하지 않을 수 있습니다. 다만 동의하지 않으면 견적서를 저장할 수
            없습니다.
          </p>
        </div>
      </div>

      {error && (
        <ul
          role="alert"
          className="mt-4 list-disc rounded-md bg-red-50 py-3 pr-4 pl-8 text-sm text-red-700"
        >
          {error.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
        <button
          type="button"
          disabled={!all || busy}
          onClick={agree}
          className="flex-1 rounded-md bg-pen px-4 py-2.5 text-sm font-medium text-white hover:bg-pen-deep disabled:opacity-50"
        >
          {busy ? "저장 중…" : "동의하고 시작하기"}
        </button>
        <button
          type="button"
          onClick={decline}
          className="rounded-md border border-slate-300 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          동의하지 않고 나가기
        </button>
      </div>
    </div>
  );
}
