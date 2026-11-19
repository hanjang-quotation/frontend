"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { inputClass } from "@/components/form";
import { ApiError, api, type AiQuota } from "@/lib/api/client";
import { errorMessages } from "@/lib/api/errors";
import { saveDraft } from "@/lib/document/draft";
import { formFromDocument } from "@/lib/document/form";
import { shrinkPhoto } from "@/lib/image";
import { industries } from "@/lib/preset/industries";

/**
 * 사진으로 가져오기: 업종을 고르고 견적서 사진을 올리면 AI(Google Gemini)가 읽어
 * 저장하지 않은 견적서를 만든다. 임시 보관본(origin ai)으로 넣고 작성 화면을 연다. 사용자가 확인하고 저장한다.
 * 사진을 외부 AI 로 보내므로 동의를 받는다. 무료는 하루 1건 (서버가 센다)
 */
export default function ImportPhoto() {
  const router = useRouter();
  const ready = industries.filter((i) => i.ready);
  const [preset, setPreset] = useState(ready[0]?.code ?? "freelancer");
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{
    messages: string[];
    needLogin?: boolean;
  } | null>(null);
  const [quota, setQuota] = useState<AiQuota | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.ai.quota().then(setQuota, (e) => {
      if (e instanceof ApiError && e.status === 401) setNeedLogin(true);
    });
  }, []);

  async function run() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const photo = await shrinkPhoto(file);
      const result = await api.ai.importImage(photo, preset);
      const form = {
        ...formFromDocument(result.document),
        profileId: undefined,
      };
      saveDraft(preset, form, "ai", result.printedTotal);
      router.push(`/documents/new?preset=${preset}`);
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 401
          ? { messages: ["로그인해야 쓸 수 있습니다."], needLogin: true }
          : e instanceof ApiError
            ? { messages: errorMessages(e) }
            : {
                messages: [
                  e instanceof Error
                    ? e.message
                    : "사진을 처리하지 못했습니다.",
                ],
              },
      );
      setBusy(false);
      api.ai.quota().then(setQuota, () => undefined);
    }
  }

  const noneLeft = quota !== null && quota.remaining <= 0;
  const unavailable = quota !== null && !quota.available;

  return (
    <div className="rounded-xl border border-rule bg-paper p-5">
      <p className="text-sm text-slate-700">
        종이 견적서나 다른 프로그램으로 만든 견적서를 찍어 올리면 AI 가
        거래처·건명· 품목·금액을 읽어 작성 화면에 채워 줍니다. 바로 저장하지
        않으니 확인하고 저장하세요.
      </p>

      {needLogin ? (
        <p className="mt-4 text-sm text-slate-600">
          로그인해야 쓸 수 있습니다.{" "}
          <Link
            href="/login?next=/documents/new"
            className="font-medium text-pen underline"
          >
            로그인하러 가기
          </Link>
        </p>
      ) : (
        <>
          {quota && (
            <p className="mt-2 text-xs text-slate-500">
              오늘 남은 횟수 {quota.remaining}/{quota.limit}건 (무료 요금제는
              하루 1건)
            </p>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_2fr]">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-700">업종</span>
              <select
                className={inputClass}
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
              >
                {ready.map((industry) => (
                  <option key={industry.code} value={industry.code}>
                    {industry.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="text-sm">
              <span className="mb-1 block text-slate-700">사진</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="rounded-md border border-slate-300 bg-paper px-3 py-2 hover:bg-slate-50"
                >
                  사진 고르기
                </button>
                <button
                  type="button"
                  onClick={() => cameraInput.current?.click()}
                  className="rounded-md border border-slate-300 bg-paper px-3 py-2 hover:bg-slate-50 sm:hidden"
                >
                  카메라로 찍기
                </button>
                <span className="truncate text-slate-600">
                  {file ? file.name : "고른 사진 없음"}
                </span>
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <input
                ref={cameraInput}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <label className="mt-4 flex items-start gap-2 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              사진을 읽기 위해 Google 의 AI(Gemini)로 보냅니다. Google 이 보낸
              내용을 서비스 개선에 쓸 수 있으니,{" "}
              <strong>
                주민등록번호 등 꼭 필요하지 않은 개인정보는 가리고
              </strong>{" "}
              올려 주세요. 사진은 바로 저장하지 않으며 읽은 뒤 버립니다.{" "}
              <Link href="/privacy" className="underline">
                개인정보처리방침
              </Link>
              에 동의합니다.
            </span>
          </label>

          <button
            type="button"
            disabled={!file || !consent || busy || noneLeft || unavailable}
            onClick={run}
            aria-busy={busy}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-pen px-4 py-2 text-sm font-medium text-white hover:bg-pen-deep disabled:opacity-60"
          >
            {busy && (
              // 기다리는 동안 멈춘 화면이 아님을 알리는 도는 원. 움직임 줄이기 설정이면 천천히 돈다
              <span
                aria-hidden
                className="size-4 shrink-0 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-[spin_2s_linear_infinite]"
              />
            )}
            {busy ? "AI 가 읽는 중… (보통 10~60초)" : "AI 로 읽기"}
          </button>
          {noneLeft && (
            <p className="mt-2 text-sm text-slate-600">
              오늘은 다 썼습니다. 내일 다시 쓸 수 있습니다.
            </p>
          )}
          {unavailable && (
            <p className="mt-2 text-sm text-slate-600">
              지금은 AI 로 읽기를 쓸 수 없습니다.
            </p>
          )}
        </>
      )}

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
