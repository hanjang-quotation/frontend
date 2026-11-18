import type { Metadata } from "next";
import { Suspense } from "react";
import SharedView from "./SharedView";

// 공유 링크로 보는 견적서. 로그인 없이 열린다. 사이트 메뉴 없이 견적서만 보여 준다.
// 주소(토큰)를 아는 사람만 볼 수 있으므로 검색에 올리지 않는다.
export const metadata: Metadata = {
  title: "견적서",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function SharedPage({ params }: PageProps<"/s/[token]">) {
  return (
    <Suspense
      fallback={
        <p className="py-20 text-center text-sm text-slate-500">
          견적서를 불러오는 중…
        </p>
      }
    >
      {params.then(({ token }) => (
        <SharedView token={token} />
      ))}
    </Suspense>
  );
}
