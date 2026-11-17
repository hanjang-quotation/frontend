// 백엔드 호출 공통 함수. 주소는 항상 /api 로 시작한다 (next.config.ts 의 rewrites 가 백엔드로 넘긴다).

import type { Preset, PresetSummary } from "@/lib/preset/types";

/** 백엔드 오류 응답 형식 (TECH_SPEC 9장) */
export interface ApiErrorBody {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: ApiErrorBody,
  ) {
    super(body.message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`/api${path}`, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  if (!res.ok) {
    let body: ApiErrorBody = {
      code: "UNKNOWN",
      message: "요청을 처리하지 못했습니다.",
    };
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      // JSON 이 아닌 오류 응답은 기본 메시지를 쓴다
    }
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  health: () => apiFetch<{ status: string }>("/health"),
  presets: () => apiFetch<PresetSummary[]>("/presets"),
  preset: (code: string) => apiFetch<Preset>(`/presets/${code}`),
};
