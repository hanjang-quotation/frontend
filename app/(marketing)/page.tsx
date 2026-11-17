import Link from "next/link";
import { industries } from "@/lib/preset/industries";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <section className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          내 업종에 맞는 견적서를 바로 만드세요
        </h1>
        <p className="mt-4 text-slate-600">
          업종을 고르면 필요한 항목이 미리 준비됩니다. 작성하고 PDF로
          내려받으세요.
        </p>
        <div className="mt-8 flex flex-col items-center gap-2">
          <Link
            href="/documents/new?preset=freelancer"
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
          >
            프리랜서 견적서 바로 작성하기
          </Link>
          <p className="text-sm text-slate-500">
            가입 없이 시작하고, 저장할 때만 카카오·구글로 로그인합니다.
          </p>
        </div>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        {industries.map((industry) => {
          const card = (
            <div className="h-full rounded-xl border border-slate-200 bg-white p-6 transition hover:border-blue-400 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  {industry.name}
                </h2>
                {!industry.ready && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    작업 중
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-700">
                {industry.description}
              </p>
              <p className="mt-3 text-xs text-slate-500">{industry.examples}</p>
            </div>
          );

          return industry.ready ? (
            <Link key={industry.code} href={`/${industry.code}`}>
              {card}
            </Link>
          ) : (
            <div key={industry.code} className="opacity-60">
              {card}
            </div>
          );
        })}
      </section>
    </div>
  );
}
