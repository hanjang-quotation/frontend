import Link from "next/link";
import { SITE } from "@/lib/site";

/** 모든 화면 아래쪽. 약관·개인정보처리방침 링크와 계산 안내 */
export default function SiteFooter() {
  return (
    <footer className="border-t border-rule py-6 text-center text-xs text-slate-500">
      <nav className="flex justify-center gap-4">
        <Link href="/pricing" className="hover:text-slate-800">
          요금제
        </Link>
        <Link href="/terms" className="hover:text-slate-800">
          이용약관
        </Link>
        <Link href="/privacy" className="font-semibold hover:text-slate-800">
          개인정보처리방침
        </Link>
      </nav>
      <p className="mt-2">
        계산 결과는 참고용이며 실제 세액과 다를 수 있습니다. © {SITE.name}
      </p>
    </footer>
  );
}
