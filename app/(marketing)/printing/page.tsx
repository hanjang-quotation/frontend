import type { Metadata } from "next";
import Link from "next/link";
import DocumentPreview from "@/components/document/DocumentPreview";
import { formTotals } from "@/lib/document/form";
import { printingPreset } from "@/lib/preset/printing";
import {
  printingSampleForm,
  printingSampleSupplier,
} from "@/lib/preset/printingSample";

export const metadata: Metadata = {
  title: "인쇄·제작 견적서 양식",
  description:
    "명함·전단지·배너 인쇄 견적서. 규격·용지·인쇄·후가공 사양을 적고, 수량별 가격을 함께 보여 줍니다.",
};

const points = [
  {
    title: "사양을 한 줄로",
    body: "규격, 용지, 인쇄 도수, 후가공을 따로 적으면 견적서에는 품명 아래 한 줄로 깔끔하게 정리됩니다.",
  },
  {
    title: "수량별 가격",
    body: "500매·2,000매처럼 다른 수량의 가격을 함께 적어 두면 거래처가 견적서를 보고 수량을 고를 수 있습니다.",
  },
  {
    title: "납기와 파일 조건",
    body: "납기일, 납품 방법, 파일 형식, 시안 수정 횟수를 적는 칸이 미리 준비되어 있습니다.",
  },
];

export default function PrintingLandingPage() {
  const columnLabels = printingPreset.columns.map((c) => c.label);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-sm font-medium text-pen">인쇄·제작</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
        인쇄 견적서, 사양과 수량별 가격까지 한 장에
      </h1>
      <p className="mt-4 text-slate-600">
        용지·인쇄·후가공 사양과 수량별 가격을 정리한 견적서를 PDF 한 장으로
        보냅니다. 합계와 부가세는 자동으로 계산됩니다.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/documents/new?preset=printing"
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
            preset={printingPreset}
            form={printingSampleForm}
            totals={formTotals(printingSampleForm, printingPreset)}
            docNo="EST-2026-0001"
            supplier={printingSampleSupplier}
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
        <h2 className="font-semibold text-ink">견적서에 들어가는 칸</h2>
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
