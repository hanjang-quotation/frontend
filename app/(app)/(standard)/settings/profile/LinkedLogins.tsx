"use client";

import { useEffect, useState } from "react";
import { api, type Identity, type Provider } from "@/lib/api/client";
import { errorMessages } from "@/lib/api/errors";
import { notifyAuthChanged } from "@/lib/auth";
import { formatDate } from "@/lib/format";

// 로그인 연결. 카카오와 구글을 한 계정에 묶어, 어느 쪽으로 로그인해도 같은 견적서가 보이게 한다.
// "연결하기"는 서버에 연결 시작 표시를 남기고 소셜 로그인으로 보낸다. 돌아오면 /settings/profile?link=결과 로 온다.
// 합치는 규칙은 백엔드 AccountService: 한쪽에만 자료가 있으면 그쪽으로 합치고, 양쪽 모두 있으면 합치지 않는다.

const LABELS: Record<Provider, string> = { KAKAO: "카카오", GOOGLE: "구글" };

/** 백엔드 AccountService.LinkResult (소문자) → 안내 문장 */
const RESULT_MESSAGES: Record<string, { ok: boolean; text: string }> = {
  linked: {
    ok: true,
    text: "연결했습니다. 이제 연결된 어느 쪽으로 로그인해도 이 계정으로 들어옵니다.",
  },
  already_linked: { ok: true, text: "이미 이 계정에 연결된 로그인입니다." },
  already_has_provider: {
    ok: false,
    text: "이 계정에는 같은 종류의 다른 계정이 이미 연결되어 있습니다. 먼저 연결을 해제해 주세요.",
  },
  both_have_data: {
    ok: false,
    text: "두 계정 모두 견적서·내 정보·거래처가 있어 합칠 수 없습니다. 한쪽 계정의 자료를 정리하거나 그 계정에서 탈퇴한 뒤 다시 연결해 주세요.",
  },
};

export default function LinkedLogins() {
  const [identities, setIdentities] = useState<Identity[] | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  const load = () =>
    api.identities.list().then(setIdentities, () => setIdentities([]));

  useEffect(() => {
    load();
    // 소셜 로그인에서 돌아온 결과. 새로고침 때 다시 뜨지 않게 주소에서 지운다
    const params = new URLSearchParams(window.location.search);
    const result = params.get("link");
    if (result) {
      Promise.resolve().then(() =>
        setNotice(
          RESULT_MESSAGES[result] ?? {
            ok: false,
            text: "연결하지 못했습니다.",
          },
        ),
      );
      // 계정을 합치면 로그인한 사용자가 바뀌었을 수 있다
      notifyAuthChanged();
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  async function link(provider: Provider) {
    setBusy(true);
    setNotice(null);
    try {
      await api.identities.startLink(provider);
      const url = new URL(
        `/api/oauth2/authorization/${provider.toLowerCase()}`,
        window.location.origin,
      );
      window.location.assign(url.href);
    } catch (e) {
      setNotice({
        ok: false,
        text: errorMessages(e, "연결을 시작하지 못했습니다.").join(" "),
      });
      setBusy(false);
    }
  }

  async function unlink(provider: Provider) {
    if (
      !window.confirm(
        `${LABELS[provider]} 로그인 연결을 해제할까요? 해제하면 ${LABELS[provider]}로는 이 계정에 들어올 수 없습니다.`,
      )
    )
      return;
    setBusy(true);
    setNotice(null);
    try {
      await api.identities.unlink(provider);
      await load();
    } catch (e) {
      setNotice({
        ok: false,
        text: errorMessages(e, "해제하지 못했습니다.").join(" "),
      });
    } finally {
      setBusy(false);
    }
  }

  if (identities === null) return null;

  return (
    <section className="mt-12">
      <h2 className="text-base font-semibold text-ink">로그인 연결</h2>
      <p className="mt-1 text-sm text-slate-500">
        카카오와 구글은 원래 서로 다른 계정입니다. 둘 다 연결해 두면 어느 쪽으로
        로그인해도 이 계정의 견적서가 보입니다.
      </p>

      {notice && (
        <p
          role="status"
          className={`mt-3 rounded-md px-4 py-3 text-sm ${notice.ok ? "bg-pen-soft text-pen-deep" : "bg-red-50 text-red-700"}`}
        >
          {notice.text}
        </p>
      )}

      <ul className="mt-4 divide-y divide-rule rounded-xl border border-rule bg-paper">
        {(Object.keys(LABELS) as Provider[]).map((provider) => {
          const identity = identities.find((i) => i.provider === provider);
          return (
            <li
              key={provider}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="font-medium text-ink">{LABELS[provider]}</p>
                <p className="text-sm text-slate-500">
                  {identity
                    ? `${identity.email ?? identity.name ?? "연결됨"} · ${formatDate(identity.linkedAt.slice(0, 10))} 연결`
                    : "연결되지 않음"}
                </p>
              </div>
              {identity ? (
                <button
                  type="button"
                  disabled={busy || identities.length <= 1}
                  title={
                    identities.length <= 1
                      ? "마지막 로그인 방법은 해제할 수 없습니다"
                      : undefined
                  }
                  onClick={() => unlink(provider)}
                  className="rounded-md border border-slate-300 px-2.5 py-1 text-sm hover:bg-slate-50 disabled:opacity-40"
                >
                  연결 해제
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => link(provider)}
                  className="rounded-md bg-pen px-3 py-1.5 text-sm font-medium text-white hover:bg-pen-deep disabled:opacity-50"
                >
                  {LABELS[provider]} 연결하기
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
