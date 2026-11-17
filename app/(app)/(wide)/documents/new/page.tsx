import type { Metadata } from "next";
import { Suspense } from "react";
import NewDocument from "./NewDocument";

export const metadata: Metadata = { title: "새 견적서" };

// 업종은 주소의 ?preset= 으로 고른다 (예: /documents/new?preset=event). 없으면 업종 고르기 화면.
// 로그인 없이도 작성할 수 있고, 저장할 때 로그인이 필요하다.
export default function NewDocumentPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-slate-500">작성 화면을 준비하는 중…</p>
      }
    >
      <NewDocument />
    </Suspense>
  );
}
