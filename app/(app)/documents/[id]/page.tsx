import type { Metadata } from "next";
import { Suspense } from "react";
import EditDocument from "./EditDocument";

export const metadata: Metadata = { title: "견적서 수정" };

// 문서 번호(id)는 요청 때 정해지므로 Suspense 안에서 꺼낸다 (Next 16 cacheComponents).
// 문서 내용은 로그인 쿠키가 필요해 브라우저에서 불러온다.
export default function DocumentPage({ params }: PageProps<"/documents/[id]">) {
  return (
    <Suspense
      fallback={<p className="text-sm text-slate-500">문서를 불러오는 중…</p>}
    >
      {params.then(({ id }) => (
        <EditDocument id={id} />
      ))}
    </Suspense>
  );
}
