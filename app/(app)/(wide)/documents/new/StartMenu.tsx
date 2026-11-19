"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ApiError, api } from "@/lib/api/client";
import { errorMessages } from "@/lib/api/errors";
import { saveDraft } from "@/lib/document/draft";
import { formFromDocument } from "@/lib/document/form";
import { industries } from "@/lib/preset/industries";
import ProBadge from "@/components/ProBadge";
import { SITE } from "@/lib/site";
import ImportAi from "./ImportAi";

// 새 견적서를 어떻게 시작할지 고르는 화면 (/documents/new, 업종을 고르기 전).
// 직접 작성(업종 고르기), 엑셀 파일 열기(유료), AI 로 가져오기(사진·PDF·엑셀·CSV, 무료는 하루 1건).

type Mode = "write" | "excel" | "ai";

export default function StartMenu() {
  const [mode, setMode] = useState<Mode>("write");

  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="text-xl font-bold text-ink">새 견적서</h1>
      <p className="mt-1 text-sm text-slate-500">어떻게 시작할지 고르세요.</p>

      <div
        role="tablist"
        aria-label="시작 방법"
        className="mt-6 grid grid-cols-3 gap-2"
      >
        <ModeButton
          active={mode === "write"}
          onClick={() => setMode("write")}
          title="직접 작성"
          body="업종을 고르고 처음부터"
        />
        <ModeButton
          active={mode === "excel"}
          onClick={() => setMode("excel")}
          title="엑셀 파일 열기"
          body="내려받은 엑셀을 다시"
          pro
        />
        <ModeButton
          active={mode === "ai"}
          disabled={!SITE.aiImportOpen}
          onClick={() => setMode("ai")}
          title="AI 로 가져오기"
          body={
            SITE.aiImportOpen
              ? "사진·PDF·엑셀을 읽어 채움 (무료 3회)"
              : "준비 중입니다"
          }
        />
      </div>

      <div className="mt-6">
        {mode === "write" && <ChooseIndustry />}
        {mode === "excel" && <OpenExcel />}
        {mode === "ai" && SITE.aiImportOpen && <ImportAi />}
      </div>
    </div>
  );
}

function ModeButton({
  active,
  disabled = false,
  onClick,
  title,
  body,
  pro = false,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  body: string;
  pro?: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      disabled={disabled}
      onClick={onClick}
      title={disabled ? "준비 중인 기능입니다" : undefined}
      className={`rounded-lg border px-3 py-3 text-left transition-colors ${
        active
          ? "border-pen bg-pen-soft"
          : "border-rule bg-paper hover:border-slate-400"
      } disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-rule`}
    >
      <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
        {title}
        {pro && <ProBadge className="" />}
      </span>
      <span className="mt-0.5 block text-xs text-slate-500">{body}</span>
    </button>
  );
}

/** 업종 고르기. 쓸 수 있는 업종만 */
function ChooseIndustry() {
  return (
    <>
      <p className="text-sm text-slate-600">
        업종마다 필요한 칸과 계산 방식이 미리 준비되어 있습니다.
      </p>
      <ul className="mt-3 divide-y divide-rule rounded-xl border border-rule bg-paper">
        {industries
          .filter((industry) => industry.ready)
          .map((industry) => (
            <li key={industry.code}>
              <Link
                href={`/documents/new?preset=${industry.code}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-pen-soft"
              >
                <div>
                  <p className="font-semibold text-ink">{industry.name}</p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {industry.description}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {industry.examples}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium text-pen">
                  쓰기
                </span>
              </Link>
            </li>
          ))}
      </ul>
    </>
  );
}

/**
 * 엑셀 파일 열기. 서버가 읽어 저장하지 않은 견적서로 돌려주면 임시 보관본으로 넣고 작성 화면을 연다.
 * 사용자가 확인하고 저장한다 (바로 저장하지 않는다)
 */
function OpenExcel() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{
    messages: string[];
    needLogin?: boolean;
  } | null>(null);

  async function open(file: File) {
    setBusy(true);
    setError(null);
    try {
      const doc = await api.documents.importXlsx(file);
      const form = { ...formFromDocument(doc), profileId: undefined };
      saveDraft(doc.presetSnapshot.code, form, "excel");
      router.push(`/documents/new?preset=${doc.presetSnapshot.code}`);
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 401
          ? {
              messages: ["로그인해야 엑셀 파일을 열 수 있습니다."],
              needLogin: true,
            }
          : { messages: errorMessages(e) },
      );
      setBusy(false);
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-rule bg-paper p-5">
      <p className="text-sm text-slate-700">
        바로 한장에서 내려받은 엑셀(.xlsx)을 올리면 견적서로 열립니다. 엑셀에서
        고친{" "}
        <strong>
          건명, 품목(이름·규격·수량·단가, 줄 추가·삭제), 조건, 비고
        </strong>
        도 그대로 반영됩니다.
      </p>
      <p className="mt-1 text-xs text-slate-500">
        거래처, 세금 방식, 공과잡비·기업이윤 비율은 내려받을 때의 값으로
        열립니다. 열린 뒤 작성 화면에서 확인하고 저장하세요. 다른 양식의 엑셀은
        &ldquo;AI 로 가져오기&rdquo;로 읽을 수 있습니다 (품목은 엑셀에서 복사해
        붙여넣을 수도 있습니다).
      </p>
      <input
        ref={input}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) open(file);
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className="mt-4 rounded-md bg-pen px-4 py-2 text-sm font-medium text-white hover:bg-pen-deep disabled:opacity-60"
      >
        {busy ? "여는 중…" : "엑셀 파일 고르기"}
      </button>
      {error && (
        <div
          role="alert"
          className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <ul className="list-disc space-y-0.5 pl-4">
            {error.messages.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          {error.needLogin && (
            <Link
              href="/login?next=/documents/new"
              className="mt-2 inline-block font-medium underline"
            >
              로그인하러 가기
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
