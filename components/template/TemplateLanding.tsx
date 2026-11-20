import Link from "next/link";
import { SITE } from "@/lib/site";
import { TEMPLATE_PAGE_LIST, type TemplatePageContent } from "@/lib/templates";
import TemplatePicker from "./TemplatePicker";

// 빈 양식 페이지 공통 틀 (견적서·거래명세서·청구서).
// 흐름: 받기 → 엑셀로 쓰다가 올리면 한 장 → 쓰던 파일은 AI 로 → 꼭 들어가는 항목 → 자주 묻는 질문 → 바로 작성.
// 같은 종류를 나열할 때는 카드 대신 괘선 줄 (DESIGN.md The Ruled List Rule)

const steps = (name: string) => [
  {
    title: "받기",
    body: `위에서 ${name} 엑셀 양식을 받습니다. 로그인은 필요 없습니다.`,
  },
  {
    title: "쓰기",
    body: "엑셀에서 받는 분, 건명, 품목을 채웁니다. 금액·세금·합계는 계산식이 맞춰 줍니다.",
  },
  {
    title: "올리기",
    body: `다 쓴 엑셀을 ${SITE.name}에 올리면 PDF 한 장으로 정리되고, 거래처와 품목이 저장되어 다음에는 고르기만 하면 됩니다.`,
  },
];

export default function TemplateLanding({
  page,
}: {
  page: TemplatePageContent;
}) {
  const others = TEMPLATE_PAGE_LIST.filter((p) => p.key !== page.key);
  const faqJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="py-14 lg:py-20">
        <h1 className="font-display text-4xl leading-tight font-bold text-ink sm:text-5xl">
          {page.name} 양식
        </h1>
        <p className="mt-5 mb-10 max-w-xl text-base leading-relaxed text-slate-600">
          {page.intro}
        </p>
        <TemplatePicker page={page} />
      </section>

      <section className="border-t border-rule py-14">
        <h2 className="font-display text-2xl font-bold text-ink">
          엑셀로 쓰다가, 올리면 한 장으로
        </h2>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          받은 양식은 엑셀에서 그대로 쓰셔도 됩니다. 정리가 필요해지면 그 파일을
          그대로 올려 주세요.
        </p>
        <ol className="mt-8 divide-y divide-rule border-y border-rule">
          {steps(page.name).map((s) => (
            <li
              key={s.title}
              className="grid gap-1 py-5 sm:grid-cols-[160px_1fr] sm:gap-6"
            >
              <p className="font-semibold text-ink">{s.title}</p>
              <p className="text-sm leading-relaxed text-slate-700">{s.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-slate-500">
          올리는 곳: 새 견적서 →{" "}
          <Link
            href="/documents/new"
            className="text-pen underline-offset-4 hover:underline"
          >
            엑셀 파일 열기
          </Link>
          . 양식에서 받은 엑셀은 무료로 열립니다.
        </p>
      </section>

      <section className="border-t border-rule py-14">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">
              이미 쓰던 {page.name} 파일이 있다면
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
              다른 양식으로 만든 엑셀, PDF, 종이 {page.name} 사진도 그대로
              올리세요. AI가 받는 분, 품목, 금액을 읽어 칸을 채워 줍니다.
              저장하기 전에 직접 확인하고 고칠 수 있습니다.
            </p>
          </div>
          <Link
            href="/documents/new"
            className="inline-block self-start rounded-md border border-slate-300 bg-paper px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 lg:self-end"
          >
            AI로 가져오기
          </Link>
        </div>
      </section>

      <section className="border-t border-rule py-14">
        <h2 className="font-display text-2xl font-bold text-ink">
          {page.name}에 꼭 들어가는 항목
        </h2>
        <dl className="mt-8 divide-y divide-rule border-y border-rule">
          {page.items.map((item) => (
            <div
              key={item.term}
              className="grid gap-1 py-4 sm:grid-cols-[160px_1fr] sm:gap-6"
            >
              <dt className="font-semibold text-ink">{item.term}</dt>
              <dd className="text-sm leading-relaxed text-slate-700">
                {item.body}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t border-rule py-14">
        <h2 className="font-display text-2xl font-bold text-ink">
          자주 묻는 질문
        </h2>
        <div className="mt-8 divide-y divide-rule border-y border-rule">
          {page.faq.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex list-none items-center justify-between gap-4 font-medium text-ink [&::-webkit-details-marker]:hidden">
                {f.q}
                <svg
                  aria-hidden
                  viewBox="0 0 16 16"
                  className="size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-45 motion-reduce:transition-none"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                >
                  <path d="M8 3v10M3 8h10" />
                </svg>
              </summary>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                {f.a}
              </p>
            </details>
          ))}
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJson) }}
        />
      </section>

      <section className="border-t border-rule py-16">
        <h2 className="font-display text-2xl font-bold text-ink">
          엑셀 없이, 여기서 바로
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
          업종에 맞는 칸이 미리 들어 있고, 채우는 대로 합계와 세금이 계산됩니다.
          다 쓰면 PDF 한 장으로 받습니다.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link
            href="/documents/new"
            className="rounded-md bg-pen px-5 py-3 font-medium text-white hover:bg-pen-deep"
          >
            가입 없이 바로 작성하기
          </Link>
          <span className="text-sm text-slate-500">
            저장할 때만 카카오·구글로 로그인합니다.
          </span>
        </div>
        <p className="mt-10 text-sm text-slate-500">
          다른 양식:{" "}
          {others.map((p, i) => (
            <span key={p.key}>
              {i > 0 && " · "}
              <Link
                href={`/templates/${p.key}`}
                className="text-pen underline-offset-4 hover:underline"
              >
                {p.name} 양식
              </Link>
            </span>
          ))}
        </p>
      </section>
    </div>
  );
}
