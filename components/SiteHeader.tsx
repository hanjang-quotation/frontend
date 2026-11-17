import Link from "next/link";
import AuthMenu from "@/components/AuthMenu";
import BrandMark from "@/components/BrandMark";
import { SITE } from "@/lib/site";

/**
 * 사이트 맨 위 메뉴. 안쪽 폭은 그 아래 본문과 왼쪽·오른쪽 끝이 맞도록 레이아웃이 넘겨 준다.
 * 기본값은 소개 화면(marketing)의 폭이다. 새 견적서는 첫 화면과 내 문서에서 시작한다.
 */
export default function SiteHeader({
  widthClass = "max-w-5xl",
}: {
  widthClass?: string;
}) {
  return (
    <header className="border-b border-rule bg-paper">
      <div
        className={`mx-auto flex h-14 ${widthClass} items-center justify-between gap-3 px-4`}
      >
        <Link href="/" aria-label={`${SITE.name} 처음으로`}>
          <BrandMark />
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-600">
          <Link href="/documents" className="hover:text-ink">
            내 문서
          </Link>
          <Link
            href="/settings/clients"
            className="hidden hover:text-ink md:inline"
          >
            거래처
          </Link>
          <Link
            href="/settings/profile"
            className="hidden hover:text-ink md:inline"
          >
            내 정보
          </Link>
          <AuthMenu />
        </nav>
      </div>
    </header>
  );
}
