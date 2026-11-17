import { ApiError } from "./client";

/**
 * 서버 오류를 화면에 보여 줄 문장 목록으로 바꾼다.
 * 입력값 오류면 서버가 준 필드별 문장(중복 제거), 아니면 서버 메시지.
 */
export function errorMessages(
  e: unknown,
  fallback = "저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
): string[] {
  if (e instanceof ApiError) {
    if (e.status === 401) return ["로그인이 필요합니다."];
    const fields = Object.values(e.body.fields ?? {});
    return fields.length > 0 ? [...new Set(fields)] : [e.body.message];
  }
  return [fallback];
}

/** 목록을 불러오지 못했을 때의 화면 상태 */
export function loadError(
  e: unknown,
  what: string,
): { kind: "error"; message: string; needLogin?: boolean } {
  return e instanceof ApiError && e.status === 401
    ? { kind: "error", message: "로그인이 필요합니다.", needLogin: true }
    : { kind: "error", message: `${what}을(를) 불러오지 못했습니다.` };
}
