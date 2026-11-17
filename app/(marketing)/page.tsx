import Link from "next/link";
import { Seal } from "@/components/BrandMark";
import DocumentPreview from "@/components/document/DocumentPreview";
import { formTotals } from "@/lib/document/form";
import { freelancerPreset } from "@/lib/preset/freelancer";
import {
  freelancerSampleForm,
  freelancerSampleSupplier,
} from "@/lib/preset/freelancerSample";
import { industries } from "@/lib/preset/industries";

// 첫 화면. 책상(desk) 위에 견적서 한 장을 놓고, 페이지가 열리면 도장이 한 번 찍힌다 (globals.css .stamp-in).
// 그 아래는 업종별 양식 목록. 준비된 업종만 바로 쓸 수 있다.
export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="grid items-center gap-10 py-14 lg:grid-cols-[1fr_minmax(0,500px)] lg:py-20">
        <div>
          <h1 className="font-display text-4xl leading-tight font-bold text-ink sm:text-5xl">
            견적서,
            <br />
            바로 한 장.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-600">
            업종에 맞는 항목이 미리 들어 있습니다. 채우는 대로 합계와 세금이
            계산되고, 다 쓰면 PDF 한 장으로 내려받습니다.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/documents/new?preset=freelancer"
              className="rounded-md bg-pen px-5 py-3 font-medium text-white hover:bg-pen-deep"
            >
              견적서 쓰기
            </Link>
            <Link
              href="/freelancer"
              className="text-sm text-pen underline underline-offset-4 hover:text-pen-deep"
            >
              프리랜서 견적서 예시 보기
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            로그인 없이 바로 쓸 수 있습니다. 저장할 때만 카카오·구글로
            로그인합니다.
          </p>
        </div>

        {/* 책상 위의 견적서 한 장. 길어서 아래쪽은 흐리게 잘라 보여 준다 */}
        <div className="relative mx-auto w-full max-w-[500px]" aria-hidden>
          <div className="h-[520px] -rotate-1 overflow-hidden rounded-sm shadow-[0_1px_2px_rgba(26,34,51,0.08),0_12px_32px_-8px_rgba(26,34,51,0.22)] [mask-image:linear-gradient(to_bottom,black_78%,transparent)]">
            <div className="[&>article]:rounded-none [&>article]:border-0 [&>article]:shadow-none">
              <DocumentPreview
                preset={freelancerPreset}
                form={freelancerSampleForm}
                totals={formTotals(freelancerSampleForm)}
                docNo="EST-2026-0001"
                supplier={freelancerSampleSupplier}
              />
            </div>
          </div>
          <Seal className="stamp-in absolute top-40 right-6 h-16 w-16 border-2 text-xl opacity-85 mix-blend-multiply" />
        </div>
      </section>

      <section className="pb-20">
        <h2 className="font-display text-2xl font-bold text-ink">
          업종별 양식
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          업종마다 필요한 칸과 계산 방식이 다릅니다. 지금은 프리랜서 양식을 쓸
          수 있고, 나머지는 만들고 있습니다.
        </p>
        <ul className="mt-6 divide-y divide-rule border-y border-rule">
          {industries.map((industry) => (
            <li
              key={industry.code}
              className="grid gap-1 py-5 sm:grid-cols-[160px_1fr_auto] sm:items-center sm:gap-6"
            >
              <p
                className={`font-semibold ${industry.ready ? "text-ink" : "text-slate-400"}`}
              >
                {industry.name}
              </p>
              <div className={industry.ready ? "" : "opacity-60"}>
                <p className="text-sm text-slate-700">{industry.description}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {industry.examples}
                </p>
              </div>
              {industry.ready ? (
                <Link
                  href={`/${industry.code}`}
                  className="text-sm font-medium text-pen hover:text-pen-deep sm:justify-self-end"
                >
                  양식 보기
                </Link>
              ) : (
                <span className="text-xs text-slate-400 sm:justify-self-end">
                  준비 중
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
