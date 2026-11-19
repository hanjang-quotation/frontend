"use client";

import { sharePath } from "@/lib/paths";
import { useState } from "react";
import { inputClass } from "@/components/form";
import { api } from "@/lib/api/client";
import { errorMessages } from "@/lib/api/errors";
import type { ShareInfo } from "@/lib/document/types";
import { formatDateTimeShort } from "@/lib/format";

/**
 * 공유 링크 켜기·끄기와 주소 복사, 열람 확인.
 * 링크는 마지막으로 저장한 내용을 보여 준다. 끄면 그 주소는 막히고, 다시 만들면 새 주소가 된다.
 */
export default function SharePanel({
  documentId,
  share,
  onChange,
  dirty,
}: {
  documentId: number;
  share: ShareInfo | null;
  onChange: (share: ShareInfo | null) => void;
  /** 저장하지 않은 수정이 있는지 (링크에는 보이지 않으므로 알려 준다) */
  dirty: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const url =
    share && typeof window !== "undefined"
      ? `${window.location.origin}${sharePath(share.token)}`
      : "";

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setNotice(null);
    try {
      await action();
    } catch (e) {
      setNotice(errorMessages(e).join(" "));
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setNotice("주소를 복사했습니다. 메신저나 메일에 붙여 넣어 보내세요.");
    } catch {
      setNotice("복사하지 못했습니다. 주소를 직접 선택해 복사해 주세요.");
    }
  }

  return (
    <div className="mb-3 rounded-lg border border-rule bg-paper p-4 text-sm">
      {!share ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-slate-600">
            링크를 만들면 받는 분이 로그인 없이 견적서를 보고 PDF로 받을 수
            있습니다.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(async () => {
                onChange(await api.documents.share(documentId));
              })
            }
            className="rounded-md bg-pen px-3 py-1.5 font-medium text-white hover:bg-pen-deep disabled:opacity-60"
          >
            링크 만들기
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              className={inputClass}
              readOnly
              value={url}
              aria-label="공유 링크 주소"
              onFocus={(e) => e.target.select()}
            />
            <button
              type="button"
              onClick={copy}
              className="shrink-0 rounded-md bg-pen px-3 font-medium text-white hover:bg-pen-deep"
            >
              복사
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-slate-600">
              {share.firstViewedAt ? (
                <>
                  받는 분이 열어 봤습니다 · 처음{" "}
                  {formatDateTimeShort(share.firstViewedAt)}
                  {share.lastViewedAt &&
                    share.lastViewedAt !== share.firstViewedAt && (
                      <> · 마지막 {formatDateTimeShort(share.lastViewedAt)}</>
                    )}
                </>
              ) : (
                "아직 열어 보지 않았습니다."
              )}
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (
                  !window.confirm(
                    "링크를 끌까요? 이 주소로는 더 볼 수 없고, 다시 만들면 새 주소가 됩니다.",
                  )
                )
                  return;
                run(async () => {
                  await api.documents.unshare(documentId);
                  onChange(null);
                });
              }}
              className="text-slate-500 hover:text-red-700 disabled:opacity-60"
            >
              링크 끄기
            </button>
          </div>
          {dirty && (
            <p className="mt-2 text-xs text-amber-700">
              저장하지 않은 수정은 링크에 보이지 않습니다. 저장하면 바로
              반영됩니다.
            </p>
          )}
        </>
      )}
      {notice && (
        <p role="status" className="mt-2 text-xs text-pen-deep">
          {notice}
        </p>
      )}
    </div>
  );
}
