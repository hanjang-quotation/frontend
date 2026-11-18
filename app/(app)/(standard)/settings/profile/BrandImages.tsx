"use client";

/* eslint-disable @next/next/no-img-element -- 로그인한 본인 이미지(/api/images)를 그대로 보여 준다 */

import { useEffect, useRef, useState } from "react";
import { inputClass } from "@/components/form";
import { api } from "@/lib/api/client";
import { errorMessages } from "@/lib/api/errors";
import { drawStamp, imageUrl, shrinkImage, type ImageKind } from "@/lib/image";

/**
 * 내 정보의 로고·도장 (유료 기능). 올리면 바로 서버에 저장하고 id 를 내 정보 값에 넣는다
 * (내 정보를 저장해야 문서에 쓰인다). 도장은 이미지를 올리거나 이름으로 만들 수 있다
 */
export default function BrandImages({
  logoImageId,
  stampImageId,
  nameHint,
  onChange,
}: {
  logoImageId: number | null;
  stampImageId: number | null;
  /** 도장 만들기의 기본 이름 (대표자 또는 상호) */
  nameHint: string;
  onChange: (patch: {
    logoImageId?: number | null;
    stampImageId?: number | null;
  }) => void;
}) {
  const [canUsePaid, setCanUsePaid] = useState<boolean | null>(null);
  useEffect(() => {
    api.me().then(
      (me) => setCanUsePaid(me?.canUsePaid ?? false),
      () => setCanUsePaid(false),
    );
  }, []);

  return (
    <fieldset className="rounded-lg border border-rule p-4">
      <legend className="px-1 text-sm font-semibold text-ink">
        로고·도장{" "}
        <span className="rounded bg-pen-soft px-1 py-px text-[10px] font-semibold tracking-wide text-pen">
          PRO
        </span>
      </legend>
      <p className="text-xs text-slate-500">
        로고는 문서 맨 위, 도장은 공급자 이름 옆(거래명세서는 성명 칸)에
        나옵니다. 바꿔도 이미 저장한 문서는 그대로입니다.
      </p>
      {canUsePaid === false ? (
        <p className="mt-3 text-sm text-slate-600">
          유료 요금제에서 쓸 수 있는 기능입니다.
        </p>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <ImageSlot
            kind="LOGO"
            label="로고"
            imageId={logoImageId}
            onChange={(id) => onChange({ logoImageId: id })}
          />
          <div>
            <ImageSlot
              kind="STAMP"
              label="도장"
              imageId={stampImageId}
              onChange={(id) => onChange({ stampImageId: id })}
            />
            <StampMaker
              nameHint={nameHint}
              onMade={(id) => onChange({ stampImageId: id })}
            />
          </div>
        </div>
      )}
    </fieldset>
  );
}

/** 이미지 한 칸: 미리보기, 올리기, 지우기 */
function ImageSlot({
  kind,
  label,
  imageId,
  onChange,
}: {
  kind: ImageKind;
  label: string;
  imageId: number | null;
  onChange: (id: number | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const small = await shrinkImage(file, kind);
      const saved = await api.images.upload(small, kind);
      onChange(saved.id);
    } catch (e) {
      setError(
        e instanceof Error && !("status" in e)
          ? e.message
          : errorMessages(e).join(" "),
      );
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <p className="text-sm text-slate-700">{label}</p>
      <div
        className={`mt-1 flex items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 ${
          kind === "LOGO" ? "h-20" : "h-24 w-24"
        }`}
      >
        {imageId ? (
          <img
            src={imageUrl(imageId)}
            alt={`${label} 미리보기`}
            className="max-h-full max-w-full object-contain p-1"
          />
        ) : (
          <span className="text-xs text-slate-400">없음</span>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />
      <div className="mt-2 flex gap-3 text-sm">
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="font-medium text-pen hover:text-pen-deep disabled:opacity-60"
        >
          {busy ? "올리는 중…" : imageId ? "바꾸기" : "이미지 올리기"}
        </button>
        {imageId && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-slate-500 hover:text-red-700"
          >
            빼기
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-400">
        PNG·JPG. 큰 이미지는 자동으로 줄입니다
        {kind === "STAMP" && " (배경이 투명한 PNG 가 가장 깔끔합니다)"}.
      </p>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

/** 이름으로 도장 만들기: 미리 그려 보고 "이 도장 쓰기"로 올린다 */
function StampMaker({
  nameHint,
  onMade,
}: {
  nameHint: string;
  onMade: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const text = name.trim() || nameHint.trim();

  // 이름이 바뀌면 미리보기를 다시 그린다
  useEffect(() => {
    if (!open || !text) return;
    let cancelled = false;
    drawStamp(text).then(
      (canvas) => {
        if (!cancelled) setPreview(canvas.toDataURL("image/png"));
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [open, text]);

  async function use() {
    setBusy(true);
    setError(null);
    try {
      const canvas = await drawStamp(text);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("도장을 만들지 못했습니다.");
      const saved = await api.images.upload(blob, "STAMP");
      onMade(saved.id);
      setOpen(false);
    } catch (e) {
      setError(
        e instanceof Error && !("status" in e)
          ? e.message
          : errorMessages(e).join(" "),
      );
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-sm font-medium text-pen hover:text-pen-deep"
      >
        이름으로 도장 만들기
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-md bg-slate-50 p-3">
      <label className="block text-xs text-slate-600">
        도장에 넣을 이름 (끝에 &ldquo;인&rdquo;이 붙습니다)
        <input
          className={`${inputClass} mt-1`}
          value={name}
          maxLength={8}
          onChange={(e) => setName(e.target.value)}
          placeholder={nameHint || "예: 한장인테리어"}
        />
      </label>
      <div className="mt-2 flex items-end gap-3">
        <div className="flex h-24 w-24 items-center justify-center rounded border border-rule bg-paper">
          {preview && text ? (
            <img src={preview} alt="도장 미리보기" className="h-20 w-20" />
          ) : (
            <span className="text-xs text-slate-400">이름 입력</span>
          )}
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <button
            type="button"
            disabled={busy || !text}
            onClick={use}
            className="rounded-md bg-pen px-3 py-1.5 font-medium text-white hover:bg-pen-deep disabled:opacity-60"
          >
            {busy ? "만드는 중…" : "이 도장 쓰기"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-slate-500 hover:text-ink"
          >
            닫기
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        견적서 등에 찍는 표시용 도장입니다. 인감 등록한 도장과 법적 효력이 다를
        수 있습니다.
      </p>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
