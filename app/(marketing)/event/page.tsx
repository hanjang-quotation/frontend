import type { Metadata } from "next";
import Link from "next/link";
import DocumentPreview from "@/components/document/DocumentPreview";
import { formTotals } from "@/lib/document/form";
import { eventPreset } from "@/lib/preset/event";
import { eventSampleForm, eventSampleSupplier } from "@/lib/preset/eventSample";

export const metadata: Metadata = {
  title: "행사·케이터링 견적서 양식",
  description:
    "출장 뷔페·케이터링·행사 대행 견적서. 인원 × 1인 단가로 금액을 계산하고, 행사일·장소·취소 규정과 부가세까지 한 장에 담습니다.",
};

const points = [
  {
    title: "인원 기준 계산",
    body: "인원 × 1인 단가로 금액이 바로 나옵니다. 서빙 인력, 장비 대여, 출장비는 줄을 나눠 적습니다.",
  },
  {
    title: "행사 조건을 한 장에",
    body: "행사일·시간·장소·예상 인원·결제 조건·취소 규정을 적는 칸이 미리 준비되어 있습니다.",
  },
  {
    title: "부가세 별도 기본",
    body: "공급가액·부가세·합계를 나눠 보여 줍니다. 세금 표시 안 함, 3.3% 공제도 고를 수 있습니다.",
  },
];

export default function EventLandingPage() {
  const columnLabels = eventPreset.columns.map((c) => c.label);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-sm font-medium text-pen">행사·케이터링</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
        출장 뷔페·행사 견적서, 인원만 넣으면 됩니다
      </h1>
      <p className="mt-4 text-slate-600">
        인원과 1인 단가를 넣으면 금액과 부가세가 계산되고, 행사 조건까지 담긴
        견적서를 PDF 한 장으로 보냅니다.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/documents/new?preset=event"
          className="inline-block rounded-lg bg-pen px-5 py-3 font-medium text-white hover:bg-pen-deep"
        >
          가입 없이 바로 작성하기
        </Link>
        <span className="text-sm text-slate-500">
          저장하거나 PDF로 받을 때만 카카오·구글로 로그인합니다.
        </span>
      </div>

      <section className="mt-12">
        <h2 className="font-semibold text-ink">이렇게 만들어집니다</h2>
        <p className="mt-1 text-sm text-slate-500">
          아래는 예시입니다. 작성 화면에서 입력하는 대로 이 모양이 바로 바뀌고,
          같은 모양으로 PDF를 내려받습니다.
        </p>
        <div className="mt-4">
          <DocumentPreview
            preset={eventPreset}
            form={eventSampleForm}
            totals={formTotals(eventSampleForm, eventPreset)}
            docNo="EST-2026-0001"
            supplier={eventSampleSupplier}
          />
        </div>
      </section>

      <ul className="mt-12 space-y-6">
        {points.map((p) => (
          <li
            key={p.title}
            className="rounded-xl border border-rule bg-paper p-5"
          >
            <h2 className="font-semibold text-ink">{p.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{p.body}</p>
          </li>
        ))}
      </ul>

      <section className="mt-12">
        <h2 className="font-semibold text-ink">견적서에 들어가는 열</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {columnLabels.map((label) => (
            <span
              key={label}
              className="rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-700"
            >
              {label}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
