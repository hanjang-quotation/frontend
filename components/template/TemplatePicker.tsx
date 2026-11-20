"use client";

import { useState, useSyncExternalStore } from "react";
import DocumentPreview from "@/components/document/DocumentPreview";
import { emptyForm, formTotals } from "@/lib/document/form";
import type { PartyView } from "@/lib/party/types";
import { presetOf } from "@/lib/preset";
import { templateUrl, type TemplatePageContent } from "@/lib/templates";

// 양식 고르기 + 책상 위에 놓인 빈 양식 + 받기 버튼.
// 견적서는 업종 4개 중 하나를 고르면 미리보기와 받을 파일이 바뀐다. 거래명세서·청구서는 양식이 하나다.

export default function TemplatePicker({
  page,
}: {
  page: TemplatePageContent;
}) {
  // 사용자가 고른 것이 먼저, 없으면 주소의 ?industry=, 그것도 없으면 첫 번째
  // (정적 내보내기라 주소는 브라우저에서 읽는다)
  const [choice, setSelected] = useState<number | null>(null);
  const search = useSyncExternalStore(
    noSubscribe,
    () => window.location.search,
    () => "",
  );
  const fromQuery = page.files.findIndex(
    (f) => f.presetCode === new URLSearchParams(search).get("industry"),
  );
  const selected = choice ?? Math.max(fromQuery, 0);
  const file = page.files[selected];
  const preset = presetOf(file.presetCode);
  const form = preset ? emptyForm(preset, "") : null;
  const many = page.files.length > 1;

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1fr_minmax(0,460px)]">
      <div>
        {many && (
          <fieldset>
            <legend className="text-sm font-medium text-slate-600">
              업종을 고르세요
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {page.files.map((f, i) => (
                <label
                  key={f.key}
                  className={`flex cursor-pointer flex-col rounded-lg border px-3 py-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-pen ${
                    i === selected
                      ? "border-pen bg-pen-soft"
                      : "border-rule bg-paper hover:border-slate-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="template"
                    className="sr-only"
                    checked={i === selected}
                    onChange={() => setSelected(i)}
                  />
                  <span className="text-sm font-semibold text-ink">
                    {f.label}
                  </span>
                  <span className="mt-0.5 text-xs text-slate-500">
                    {f.hint}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div
          className={`flex flex-wrap items-center gap-x-5 gap-y-3 ${many ? "mt-6" : ""}`}
        >
          <a
            href={templateUrl(file.key, "xlsx")}
            download
            className="inline-flex items-center gap-2 rounded-md bg-pen px-5 py-3 font-medium text-white hover:bg-pen-deep"
          >
            <DownloadIcon />
            {many
              ? `${file.label} ${page.name} 엑셀 양식 받기`
              : `${page.name} 엑셀 양식 받기`}
          </a>
          <a
            href={templateUrl(file.key, "pdf")}
            download
            className="text-sm text-slate-600 underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-slate-400"
          >
            인쇄용 PDF 받기
          </a>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          로그인 없이 바로 받습니다. 엑셀에 합계·세금 계산식이 들어 있습니다.
        </p>
      </div>

      {/* 책상 위에 놓인 빈 양식 한 장. 아래쪽은 흐리게 잘라 보여 준다 */}
      {preset && form && (
        <div className="relative mx-auto w-full max-w-[460px]" aria-hidden>
          <div className="h-[440px] rotate-1 overflow-hidden rounded-sm shadow-[0_1px_2px_rgba(26,34,51,0.08),0_12px_32px_-8px_rgba(26,34,51,0.22)] [mask-image:linear-gradient(to_bottom,black_70%,transparent)]">
            <div className="pointer-events-none [&>article]:rounded-none [&>article]:border-0 [&>article]:shadow-none">
              <DocumentPreview
                preset={preset}
                form={form}
                totals={formTotals(form, preset)}
                supplier={BLANK_SUPPLIER}
                docType={page.docType}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const noSubscribe = () => () => {};

// 빈 양식이라 공급자 자리에 칸 이름만 보여 준다 (작성 화면의 "내 정보를 고르면…" 안내 대신)
const BLANK_SUPPLIER: PartyView = {
  name: "상호",
  details: "대표자 · 사업자번호 · 연락처 · 주소",
  bank: null,
};

function DownloadIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 3v10m0 0-4-4m4 4 4-4M4 16h12" />
    </svg>
  );
}
