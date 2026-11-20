import type { Metadata } from "next";
import Link from "next/link";
import { estimateTemplatePath } from "@/lib/templates";
import DocumentPreview from "@/components/document/DocumentPreview";
import { formTotals } from "@/lib/document/form";
import { constructionPreset } from "@/lib/preset/construction";
import {
  constructionSampleForm,
  constructionSampleSupplier,
} from "@/lib/preset/constructionSample";

export const metadata: Metadata = {
  title: "인테리어·시공 견적서 양식",
  description:
    "인테리어·리모델링 견적서. 공종별로 품목을 묶어 소계를 내고, 자재·노무 단가와 공과잡비·기업이윤, 부가세까지 자동으로 계산합니다.",
};

const points = [
  {
    title: "공종별 소계",
    body: "철거·목공·도장처럼 공종을 나누고 품목을 넣으면 공종마다 소계가 붙습니다. 공종 순서도 바꿀 수 있습니다.",
  },
  {
    title: "자재·노무 단가를 따로",
    body: "한 줄에 자재 단가와 노무 단가를 나눠 적으면 둘을 더한 단가로 금액을 계산합니다.",
  },
  {
    title: "공과잡비·기업이윤",
    body: "품목 합계에 비율만 넣으면 금액이 계산되어 공급가액에 더해집니다. 0이면 견적서에 나오지 않습니다.",
  },
];

export default function ConstructionLandingPage() {
  const columnLabels = constructionPreset.columns
    .filter((c) => c.key !== "unitPrice")
    .map((c) => c.label);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-sm font-medium text-pen">인테리어·시공</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
        공종별 시공 견적서, 소계까지 알아서
      </h1>
      <p className="mt-4 text-slate-600">
        공종마다 품목과 자재·노무 단가를 적으면 공종 소계, 공과잡비·기업이윤,
        부가세가 계산된 견적서를 PDF 한 장으로 보냅니다.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/documents/new?preset=construction"
          className="inline-block rounded-lg bg-pen px-5 py-3 font-medium text-white hover:bg-pen-deep"
        >
          가입 없이 바로 작성하기
        </Link>
        <span className="text-sm text-slate-500">
          저장하거나 PDF로 받을 때만 카카오·구글로 로그인합니다.
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-600">
        엑셀로 쓰는 게 편하다면{" "}
        <Link
          href={estimateTemplatePath("construction")}
          className="font-medium text-pen underline-offset-4 hover:underline"
        >
          이 업종 엑셀 양식 받기
        </Link>
      </p>

      <section className="mt-12">
        <h2 className="font-semibold text-ink">이렇게 만들어집니다</h2>
        <p className="mt-1 text-sm text-slate-500">
          아래는 예시입니다. 작성 화면에서 입력하는 대로 이 모양이 바로 바뀌고,
          같은 모양으로 PDF를 내려받습니다.
        </p>
        <div className="mt-4">
          <DocumentPreview
            preset={constructionPreset}
            form={constructionSampleForm}
            totals={formTotals(constructionSampleForm, constructionPreset)}
            docNo="EST-2026-0001"
            supplier={constructionSampleSupplier}
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
