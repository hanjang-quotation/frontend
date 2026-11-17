import Link from "next/link";
import AuthMenu from "@/components/AuthMenu";

export default function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-bold text-slate-900">
          견적서 만들기
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-600">
          <Link href="/documents" className="hover:text-slate-900">
            내 문서
          </Link>
          <AuthMenu />
        </nav>
      </div>
    </header>
  );
}
