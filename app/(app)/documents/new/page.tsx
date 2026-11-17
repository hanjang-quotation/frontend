import type { Metadata } from "next";
import { freelancerPreset } from "@/lib/preset/freelancer";
import DocumentEditor from "./DocumentEditor";

export const metadata: Metadata = { title: "새 견적서" };

// TODO(4단계): ?preset= 값에 따라 업종 설정을 고른다. 지금은 프리랜서만 있다.
export default function NewDocumentPage() {
  return <DocumentEditor preset={freelancerPreset} />;
}
