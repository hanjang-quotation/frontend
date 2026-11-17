import type { Metadata } from "next";
import Link from "next/link";
import { freelancerPreset } from "@/lib/preset/freelancer";

export const metadata: Metadata = {
  title: "프리랜서 견적서 양식",
  description:
    "디자인·개발 프리랜서를 위한 견적서. 작업 범위, 수정 횟수, 납기일을 넣고 3.3% 공제 금액까지 자동으로 계산합니다.",
};

const points = [
  {
    title: "외주에 맞는 항목",
    body: "작업 항목과 작업 범위, 수정 횟수, 납기일, 납품물을 적는 칸이 미리 준비되어 있습니다.",
  },
  {
    title: "3.3% 공제 자동 계산",
    body: "청구 금액에서 공제액과 실수령액을 바로 보여 줍니다. 부가세 10% 방식도 고를 수 있습니다.",
  },
  {
    title: "PDF로 바로 전달",
    body: "작성한 견적서를 PDF로 내려받아 메일이나 메신저로 보낼 수 있습니다.",
  },
];

export default function FreelancerLandingPage() {
  const columnLabels = freelancerPreset.columns.map((c) => c.label);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-sm font-medium text-blue-600">프리랜서</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        디자인·개발 외주 견적서, 5분이면 됩니다
      </h1>
      <p className="mt-4 text-slate-600">
        엑셀 양식을 고치는 대신 항목만 채우세요. 합계와 세금은 자동으로
        계산됩니다.
      </p>

      <div className="mt-8">
        <Link
          href="/documents/new?preset=freelancer"
          className="inline-block rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
        >
          견적서 작성하기
        </Link>
      </div>

      <ul className="mt-12 space-y-6">
        {points.map((p) => (
          <li
            key={p.title}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <h2 className="font-semibold text-slate-900">{p.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{p.body}</p>
          </li>
        ))}
      </ul>

      <section className="mt-12">
        <h2 className="font-semibold text-slate-900">견적서에 들어가는 열</h2>
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
