import Link from "next/link";
import AuthMenu from "@/components/AuthMenu";

/**
 * 사이트 맨 위 메뉴. 안쪽 폭은 그 아래 본문과 왼쪽·오른쪽 끝이 맞도록 레이아웃이 넘겨 준다.
 * 기본값은 소개 화면(marketing)의 폭이다.
 */
export default function SiteHeader({
  widthClass = "max-w-5xl",
}: {
  widthClass?: string;
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div
        className={`mx-auto flex h-14 ${widthClass} items-center justify-between px-4`}
      >
        <Link href="/" className="font-bold text-slate-900">
          견적서 만들기
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-600">
          <Link href="/documents" className="hover:text-slate-900">
            내 문서
          </Link>
          <Link
            href="/settings/clients"
            className="hidden hover:text-slate-900 sm:inline"
          >
            거래처
          </Link>
          <Link
            href="/settings/profile"
            className="hidden hover:text-slate-900 sm:inline"
          >
            내 정보
          </Link>
          <AuthMenu />
        </nav>
      </div>
    </header>
  );
}
