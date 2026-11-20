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

/** 올릴 수 있는 파일. 형식은 서버가 파일 머리로 다시 확인한다 */
const ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,.pdf,application/pdf,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.csv,text/csv";
/** 서버 상한 (사진은 올리기 전에 줄이므로 사진이 아닌 파일만 미리 본다) */
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * AI 로 가져오기: 업종을 고르고 견적서 파일(사진·PDF·엑셀·CSV)을 올리면 AI(배포: Claude, 로컬: NVIDIA)가 읽어
 * 저장하지 않은 견적서를 만든다. 임시 보관본(origin ai)으로 넣고 작성 화면을 연다. 사용자가 확인하고 저장한다.
 * 파일을 외부 AI 로 보내므로 동의를 받는다. 무료는 하루 1건 (서버가 센다)
 */
export default function ImportAi() {
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
      const isImage = file.type.startsWith("image/");
      if (!isImage && file.size > MAX_BYTES) {
        throw new Error("파일은 8MB 까지 올릴 수 있습니다.");
      }
      // 사진은 줄여서 JPEG 로, 나머지(PDF·엑셀·CSV)는 그대로
      const upload = isImage ? await shrinkPhoto(file) : file;
      const result = await api.ai.importFile(
        upload,
        isImage ? "photo.jpg" : file.name,
        preset,
      );
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
                    : "파일을 처리하지 못했습니다.",
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
        종이 견적서 사진이나 다른 프로그램으로 만든 견적서 파일을 올리면 AI 가
        거래처·건명·품목·금액을 읽어 작성 화면에 채워 줍니다. 바로 저장하지
        않으니 확인하고 저장하세요.
      </p>
      <p className="mt-1 text-xs text-slate-500">
        사진(JPG·PNG), PDF(앞 3쪽까지), 엑셀(.xlsx), CSV 를 올릴 수 있습니다.
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
              이번 달 남은 횟수{" "}
              <span className="tabular-nums">
                {Math.max(0, quota.limit - quota.used)}/{quota.limit}
              </span>
              회 (오늘 최대 {quota.dailyLimit}회, 오늘{" "}
              <span className="tabular-nums">{quota.usedToday}</span>회 씀)
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
              <span className="mb-1 block text-slate-700">파일</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="rounded-md border border-slate-300 bg-paper px-3 py-2 hover:bg-slate-50"
                >
                  파일 고르기
                </button>
                <button
                  type="button"
                  onClick={() => cameraInput.current?.click()}
                  className="rounded-md border border-slate-300 bg-paper px-3 py-2 hover:bg-slate-50 sm:hidden"
                >
                  카메라로 찍기
                </button>
                <span className="truncate text-slate-600">
                  {file ? file.name : "고른 파일 없음"}
                </span>
              </div>
              <input
                ref={fileInput}
                type="file"
                accept={ACCEPT}
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
              파일을 읽기 위해 Anthropic 의 AI(Claude)로 보냅니다. Anthropic 은
              보낸 내용을 AI 학습에 쓰지 않지만,{" "}
              <strong>
                주민등록번호 등 꼭 필요하지 않은 개인정보는 가리고
              </strong>{" "}
              올려 주세요. 파일은 저장하지 않으며 읽은 뒤 버립니다.{" "}
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
          {noneLeft && quota && (
            <p className="mt-2 text-sm text-slate-600">
              {quota.used >= quota.limit
                ? "이번 달 횟수를 모두 썼습니다. 다음 달 1일부터 다시 쓸 수 있습니다."
                : "오늘 쓸 수 있는 횟수를 모두 썼습니다. 내일 다시 쓸 수 있습니다."}
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
