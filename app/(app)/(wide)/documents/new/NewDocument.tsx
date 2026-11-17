"use client";

import { use } from "react";
import { browser } from "react-dom";
import { loadDraft } from "@/lib/document/draft";
import { emptyForm, todayString } from "@/lib/document/form";
import type { Preset } from "@/lib/preset/types";
import DocumentEditor from "../DocumentEditor";

// 새 견적서. 작성일 기본값(오늘)과 임시 보관본(브라우저 저장소)은 보는 사람의 브라우저에만 있으므로
// 브라우저에서만 그린다. 미리 만든 화면에는 page.tsx 의 Suspense 대체 화면이 들어간다.
export default function NewDocument({ preset }: { preset: Preset }) {
  use(browser("작성일(오늘)과 임시 보관본은 브라우저에만 있다."));
  const draft = loadDraft(preset.code);
  return (
    <DocumentEditor
      preset={preset}
      initial={draft ?? emptyForm(preset, todayString())}
      restoredDraft={draft !== null}
    />
  );
}
