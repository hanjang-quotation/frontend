import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

// 없는 주소나 notFound() 일 때의 화면. 검색엔진에는 Next.js 가 noindex 를 붙인다
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-20">
          <p className="text-sm font-semibold text-pen">404</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">
            찾는 화면이 없습니다
          </h1>
          <p className="mt-3 text-slate-600">
            주소가 바뀌었거나 지워진 화면입니다. 주소를 다시 확인해 주세요.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <Link
              href="/"
              className="rounded-md bg-pen px-4 py-2 font-medium text-white hover:bg-pen-deep"
            >
              첫 화면으로
            </Link>
            <Link
              href="/documents"
              className="rounded-md border border-rule bg-paper px-4 py-2 font-medium text-ink hover:border-slate-400"
            >
              내 문서
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
