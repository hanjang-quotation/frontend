import type { Metadata } from "next";
import Link from "next/link";
import ProBadge from "@/components/ProBadge";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "요금제",
  description: `${SITE.name} 무료·PRO 요금제 비교. PRO 는 월 ${SITE.price.monthly.toLocaleString("ko-KR")}원.`,
};

// 요금제 안내. 결제는 아직 붙이지 않았다 (지금은 PRO 기능도 모두에게 열려 있다).
// 숫자는 백엔드 설정과 같아야 한다: 문서 월 10건(FREE_MONTHLY_DOCUMENTS), AI 무료 3회·PRO 월 100회·하루 20회(AI_*)

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

const ROWS: {
  feature: string;
  free: string;
  pro: string;
  proOnly?: boolean;
}[] = [
  {
    feature: "업종별 견적서 작성, 합계·세금 자동 계산",
    free: "○",
    pro: "○",
  },
  { feature: "PDF 내려받기, 공유 링크", free: "○", pro: "○" },
  { feature: "내 정보·거래처·자주 쓰는 품목 저장", free: "○", pro: "○" },
  { feature: "도장 (올리기, 이름으로 만들기)", free: "○", pro: "○" },
  { feature: "새 문서 저장", free: "한 달 10건", pro: "제한 없음" },
  {
    feature: "PDF 아래 “바로 한장으로 작성했습니다” 문구",
    free: "들어감",
    pro: "없음",
  },
  {
    feature: `AI 로 가져오기 (사진·PDF·엑셀 읽기)${SITE.aiImportOpen ? "" : " — 준비 중"}`,
    free: "체험 3회",
    pro: "한 달 100회 (하루 20회)",
  },
  { feature: "엑셀 내려받기·다시 열기", free: "—", pro: "○", proOnly: true },
  {
    feature: "문서 변환 (견적서 → 거래명세서·청구서)",
    free: "—",
    pro: "○",
    proOnly: true,
  },
  { feature: "로고", free: "—", pro: "○", proOnly: true },
];

export default function PricingPage() {
  const yearlyMonthly = Math.round(SITE.price.yearly / 12 / 100) * 100;
  const discount = Math.round(
    (1 - SITE.price.yearly / (SITE.price.monthly * 12)) * 100,
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
        요금제
      </h1>
      <p className="mt-3 text-slate-600">
        견적서 쓰기는 무료입니다. 자주 거래한다면 PRO 로 더 빠르게.
      </p>

      <div
        role="note"
        className="mt-6 rounded-md border border-rule bg-pen-soft px-4 py-3 text-sm text-ink"
      >
        결제는 준비 중입니다. 지금은 PRO 기능도 모두 무료로 쓸 수 있습니다.
        결제를 시작하기 전에 미리 알려 드립니다.
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-rule bg-paper p-6">
          <h2 className="text-lg font-semibold text-ink">무료</h2>
          <p className="mt-2 text-3xl font-bold text-ink">0원</p>
          <p className="mt-2 text-sm text-slate-600">
            가끔 견적서를 보내는 분께. 한 달 10건까지 저장합니다.
          </p>
          <Link
            href="/documents/new"
            className="mt-5 inline-block rounded-md border border-rule bg-paper px-4 py-2 text-sm font-medium text-ink hover:border-slate-400"
          >
            견적서 쓰기
          </Link>
        </section>
        <section className="rounded-xl border-2 border-pen bg-paper p-6">
          <h2 className="flex items-center text-lg font-semibold text-ink">
            PRO
            <ProBadge className="ml-2" />
          </h2>
          <p className="mt-2 text-3xl font-bold text-ink">
            {won(SITE.price.monthly)}
            <span className="text-base font-normal text-slate-500"> / 월</span>
          </p>
          <p className="mt-1 text-sm text-slate-600">
            1년 결제는 {won(SITE.price.yearly)} (월 {won(yearlyMonthly)}꼴,{" "}
            {discount}% 할인)
          </p>
          <p className="mt-2 text-sm text-slate-600">
            견적 → 거래명세서 → 청구를 자주 하는 분께. 저장 제한 없이, 로고를
            넣고, 문서를 바로 바꿉니다.
          </p>
          <span className="mt-5 inline-block rounded-md bg-pen/60 px-4 py-2 text-sm font-medium text-white">
            결제 준비 중
          </span>
        </section>
      </div>

      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-ink text-left">
              <th className="py-2 pr-3 font-semibold text-ink">기능</th>
              <th className="w-32 py-2 text-center font-semibold text-ink">
                무료
              </th>
              <th className="w-44 py-2 text-center font-semibold text-ink">
                PRO
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.feature} className="border-b border-rule">
                <td className="py-2.5 pr-3 text-slate-700">
                  {row.feature}
                  {row.proOnly && <ProBadge />}
                </td>
                <td className="py-2.5 text-center text-slate-600">
                  {row.free}
                </td>
                <td className="py-2.5 text-center font-medium text-ink">
                  {row.pro}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-slate-500">
        가격은 부가세 포함입니다. 저장 건수는 매월 1일(한국 시간)에 다시
        채워지며, 이미 저장한 문서를 고치는 것은 세지 않습니다. AI 로 가져오기는
        성공한 것만 셉니다.
      </p>
    </div>
  );
}
