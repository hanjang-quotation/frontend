"use client";

import { use } from "react";
import { browser } from "react-dom";
import { emptyForm, todayString } from "@/lib/document/form";
import type { Preset } from "@/lib/preset/types";
import DocumentEditor from "../DocumentEditor";

// 작성일 기본값(오늘)은 보는 사람의 날짜여야 하므로 브라우저에서만 그린다.
// 미리 만든 화면에는 page.tsx 의 Suspense 대체 화면이 들어간다.
// 7단계에서 브라우저 저장소의 임시 보관 내용을 여기서 불러온다.
export default function NewDocument({ preset }: { preset: Preset }) {
  use(browser("작성 화면은 오늘 날짜로 시작하므로 브라우저에서 그린다."));
  return (
    <DocumentEditor
      preset={preset}
      initial={emptyForm(preset, todayString())}
    />
  );
}
