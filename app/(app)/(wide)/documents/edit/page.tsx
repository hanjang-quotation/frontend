import type { Metadata } from "next";
import { Suspense } from "react";
import EditDocument from "./EditDocument";

export const metadata: Metadata = { title: "견적서 수정" };

// 저장된 문서 수정 화면: /documents/edit?id=문서번호 (lib/paths.ts 의 documentPath).
// 문서 번호는 주소의 ?id 로 받아 브라우저에서 불러온다 (로그인 쿠키가 필요하다). 미리 만든 파일로도 띄울 수 있다
export default function DocumentPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-slate-500">문서를 불러오는 중…</p>}
    >
      <EditDocument />
    </Suspense>
  );
}
