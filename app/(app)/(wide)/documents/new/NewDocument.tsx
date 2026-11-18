"use client";

import { useSearchParams } from "next/navigation";
import { use } from "react";
import { browser } from "react-dom";
import { loadDraft } from "@/lib/document/draft";
import { emptyForm, todayString } from "@/lib/document/form";
import { presetOf } from "@/lib/preset";
import DocumentEditor from "../DocumentEditor";
import StartMenu from "./StartMenu";

// 새 견적서. ?preset=업종 으로 업종을 고르고, 없거나 모르는 업종이면 시작 방법 고르기(StartMenu)를 보여 준다.
// 작성일 기본값(오늘)과 임시 보관본(브라우저 저장소)은 보는 사람의 브라우저에만 있으므로 브라우저에서만 그린다.
// 업종이 바뀌면 key 로 작성 화면을 새로 만든다 (앞 업종의 입력이 남지 않게).
export default function NewDocument() {
  use(browser("작성일(오늘)과 임시 보관본은 브라우저에만 있다."));
  const preset = presetOf(useSearchParams().get("preset"));

  if (!preset) return <StartMenu />;

  const draft = loadDraft(preset);
  return (
    <DocumentEditor
      key={preset.code}
      preset={preset}
      initial={draft?.form ?? emptyForm(preset, todayString())}
      restoredFrom={draft?.origin}
    />
  );
}
