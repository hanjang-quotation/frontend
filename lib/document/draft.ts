// 새 견적서 임시 보관 (TECH_SPEC 10.2). 로그인 전에 작성하던 내용을 브라우저 저장소에 둔다.
// 서버로는 보내지 않는다. 저장소는 쓸 수 없을 수도 있으므로(개인 정보 보호 모드 등) 모든 접근을 예외 처리한다.

import type { Preset } from "@/lib/preset/types";
import { normalizeForm, type DocumentForm } from "./form";

/** 형식이 바뀌면 v 를 올린다 (예전 형식은 읽지 않는다) */
const KEY = "quotation:new-document-draft:v1";

/** 업종 설정 code 가 같은 임시 보관본만 되살린다 */
interface Stored {
  presetCode: string;
  form: DocumentForm;
}

/** 무언가 적은 게 있는지. 빈 작성 화면은 보관하지 않는다 */
export function hasContent(form: DocumentForm): boolean {
  return (
    form.title.trim() !== "" ||
    form.client.name.trim() !== "" ||
    form.notes.trim() !== "" ||
    form.lines.some(
      (l) =>
        l.name.trim() !== "" ||
        l.unitPrice !== "" ||
        Object.values(l.extra ?? {}).some((v) => v !== ""),
    )
  );
}

export function loadDraft(preset: Preset): DocumentForm | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Stored;
    if (
      stored.presetCode !== preset.code ||
      !stored.form ||
      typeof stored.form.title !== "string" ||
      !Array.isArray(stored.form.lines) ||
      stored.form.lines.length === 0
    ) {
      return null;
    }
    // 내 정보는 로그인한 사람마다 다르므로 되살리지 않는다 (불러온 뒤 기본 내 정보로 다시 고른다)
    return { ...normalizeForm(stored.form, preset), profileId: undefined };
  } catch {
    return null;
  }
}

/** 적은 게 있으면 보관하고, 없으면 지운다 */
export function saveDraft(presetCode: string, form: DocumentForm): void {
  try {
    if (hasContent(form)) {
      const stored: Stored = { presetCode, form };
      window.localStorage.setItem(KEY, JSON.stringify(stored));
    } else {
      window.localStorage.removeItem(KEY);
    }
  } catch {
    // 저장소를 쓸 수 없으면 임시 보관 없이 계속 쓴다
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // 위와 같음
  }
}
