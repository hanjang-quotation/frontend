import type { Metadata } from "next";
import { Suspense } from "react";
import { freelancerPreset } from "@/lib/preset/freelancer";
import NewDocument from "./NewDocument";

export const metadata: Metadata = { title: "새 견적서" };

// 업종이 프리랜서 하나뿐이라 ?preset= 은 아직 읽지 않는다. 업종을 추가할 때 고른다.
// 로그인 없이도 작성할 수 있고, 저장할 때 로그인이 필요하다.
export default function NewDocumentPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-slate-500">작성 화면을 준비하는 중…</p>
      }
    >
      <NewDocument preset={freelancerPreset} />
    </Suspense>
  );
}
