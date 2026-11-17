"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { use } from "react";
import { browser } from "react-dom";
import { loadDraft } from "@/lib/document/draft";
import { emptyForm, todayString } from "@/lib/document/form";
import { presetOf } from "@/lib/preset";
import { industries } from "@/lib/preset/industries";
import DocumentEditor from "../DocumentEditor";

// 새 견적서. ?preset=업종 으로 업종을 고르고, 없거나 모르는 업종이면 업종 고르기 화면을 보여 준다.
// 작성일 기본값(오늘)과 임시 보관본(브라우저 저장소)은 보는 사람의 브라우저에만 있으므로 브라우저에서만 그린다.
// 업종이 바뀌면 key 로 작성 화면을 새로 만든다 (앞 업종의 입력이 남지 않게).
export default function NewDocument() {
  use(browser("작성일(오늘)과 임시 보관본은 브라우저에만 있다."));
  const preset = presetOf(useSearchParams().get("preset"));

  if (!preset) return <ChooseIndustry />;

  const draft = loadDraft(preset.code);
  return (
    <DocumentEditor
      key={preset.code}
      preset={preset}
      initial={draft ?? emptyForm(preset, todayString())}
      restoredDraft={draft !== null}
    />
  );
}

/** 업종 고르기. 쓸 수 있는 업종만 */
function ChooseIndustry() {
  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="text-xl font-bold text-ink">어떤 견적서를 쓸까요?</h1>
      <p className="mt-1 text-sm text-slate-500">
        업종마다 필요한 칸과 계산 방식이 미리 준비되어 있습니다.
      </p>
      <ul className="mt-6 divide-y divide-rule rounded-xl border border-rule bg-paper">
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
    </div>
  );
}
