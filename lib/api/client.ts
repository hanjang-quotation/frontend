// 백엔드 호출 공통 함수. 주소는 항상 /api 로 시작한다 (next.config.ts 의 rewrites 가 백엔드로 넘긴다).

import type {
  DocumentCreateRequest,
  DocType,
  DocumentResponse,
  DocumentStatus,
  DocumentSummary,
  DocumentUpdateRequest,
  PageResponse,
  ShareInfo,
  SharedDocument,
} from "@/lib/document/types";
import type {
  Client,
  ClientRequest,
  Profile,
  ProfileRequest,
} from "@/lib/party/types";
import type { ImageKind, UploadedImage } from "@/lib/image";
import type { SavedItem, SavedItemRequest } from "@/lib/item";
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

/** GET /api/me 응답. email·name 은 소셜 서비스가 주지 않으면 비어 있다. */
export interface Me {
  id: number;
  email: string | null;
  name: string | null;
  provider: "KAKAO" | "GOOGLE";
  plan: string;
  /** 지금 버전의 이용약관·개인정보 수집·이용에 동의했는지. false 면 동의 화면(/welcome)으로 보낸다 */
  agreed: boolean;
  /** 유료 기능(엑셀·문서 변환·로고·사진)을 쓸 수 있는지. 결제를 붙이기 전에는 모두에게 열려 있다 */
  canUsePaid: boolean;
  /** 무료 제한(문서 월 저장 건수, PDF 아래 문구)이 걸리는지. 결제를 붙이기 전에는 false */
  freeLimits: boolean;
  /** 이번 달 새 문서 저장 한도와 쓴 수 (제한이 없으면 null) */
  documentLimit: number | null;
  documentsUsed: number | null;
}

/** 오늘 AI 로 가져오기 한도. available 이 false 면 서버에 AI 설정이 없다 */
export interface AiQuota {
  available: boolean;
  /** limit·used 를 센 기간: TOTAL(무료 체험, 가입 후 전부), MONTH(PRO, 이번 달) */
  period: "TOTAL" | "MONTH";
  limit: number;
  used: number;
  /** 지금 더 쓸 수 있는 수 (PRO 는 하루 상한도 반영) */
  remaining: number;
  /** 하루 상한 (0 이면 따로 없음) */
  dailyLimit: number;
  usedToday: number;
}

/** AI 로 가져온 결과. document 는 저장하지 않은 문서(id 0) */
export interface AiImportResult {
  document: DocumentResponse;
  /** 파일에 적혀 있던 최종 합계 (못 읽었으면 null) */
  printedTotal: number | null;
  remainingToday: number;
}

export type Provider = "KAKAO" | "GOOGLE";

/** 내 계정에 연결된 소셜 로그인 하나 */
export interface Identity {
  provider: Provider;
  email: string | null;
  name: string | null;
  linkedAt: string;
}

// 백엔드가 내려 준 CSRF 토큰 쿠키. 값을 바꾸는 요청에 X-XSRF-TOKEN 헤더로 돌려보낸다 (TECH_SPEC 11장)
function readCsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const cookie = document.cookie
    .split("; ")
    .find((c) => c.startsWith("XSRF-TOKEN="));
  return cookie
    ? decodeURIComponent(cookie.slice("XSRF-TOKEN=".length))
    : undefined;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  // 파일(FormData)은 브라우저가 multipart 경계를 붙여 Content-Type 을 정하므로 건드리지 않는다
  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  const method = (init.method ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    const token = readCsrfToken();
    if (token) headers.set("X-XSRF-TOKEN", token);
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
      const json = (await res.json()) as Partial<ApiErrorBody>;
      // 우리 서버 모양이 아니거나(프록시·호스팅 오류) 문장이 비어 있으면 기본 메시지를 쓴다
      if (json && typeof json.message === "string" && json.message) {
        body = { ...body, ...json, message: json.message };
      }
    } catch {
      // JSON 이 아닌 오류 응답은 기본 메시지를 쓴다
    }
    if (res.status === 504 || res.status === 502) {
      body = {
        code: "GATEWAY",
        message: "서버가 응답하지 않습니다. 잠시 뒤에 다시 해 주세요.",
      };
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

  /** 로그인하지 않았으면 null */
  me: async (): Promise<Me | null> => {
    try {
      return await apiFetch<Me>("/me");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return null;
      throw e;
    }
  },
  logout: () => apiFetch<void>("/logout", { method: "POST" }),
  /** 이용약관·개인정보 수집·이용 동의 (둘 다 필수) */
  agree: () =>
    apiFetch<void>("/me/agreements", {
      method: "POST",
      body: JSON.stringify({ terms: true, privacy: true }),
    }),
  /** 회원 탈퇴. 내 정보·거래처·문서가 모두 지워진다 */
  withdraw: () => apiFetch<void>("/me", { method: "DELETE" }),

  /** 내 계정에 연결된 소셜 로그인 */
  identities: {
    list: () => apiFetch<Identity[]>("/me/identities"),
    /** 연결 시작 표시만 남긴다. 이어서 소셜 로그인 주소로 보내야 연결된다 (10분 안에) */
    startLink: (provider: Provider) =>
      apiFetch<void>(`/me/identities/${provider.toLowerCase()}/link`, {
        method: "POST",
      }),
    unlink: (provider: Provider) =>
      apiFetch<void>(`/me/identities/${provider.toLowerCase()}`, {
        method: "DELETE",
      }),
  },

  /** 내 정보. 기본이 맨 앞 */
  profiles: {
    list: () => apiFetch<Profile[]>("/profiles"),
    create: (body: ProfileRequest) =>
      apiFetch<Profile>("/profiles", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: number, body: ProfileRequest) =>
      apiFetch<Profile>(`/profiles/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    remove: (id: number) =>
      apiFetch<void>(`/profiles/${id}`, { method: "DELETE" }),
  },

  /** 거래처. 상호 가나다순, q 로 상호 검색 */
  clients: {
    list: (q?: string) =>
      apiFetch<Client[]>(`/clients${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    create: (body: ClientRequest) =>
      apiFetch<Client>("/clients", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: number, body: ClientRequest) =>
      apiFetch<Client>(`/clients/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    remove: (id: number) =>
      apiFetch<void>(`/clients/${id}`, { method: "DELETE" }),
  },

  /** 로고·도장 이미지 올리기 (유료 기능). 줄인 이미지를 보낸다 (lib/image.ts 의 shrinkImage) */
  images: {
    upload: (image: Blob, kind: ImageKind) => {
      const body = new FormData();
      body.append("file", image, kind === "LOGO" ? "logo.png" : "stamp.png");
      body.append("kind", kind);
      return apiFetch<UploadedImage>("/images", { method: "POST", body });
    },
  },

  /** AI 로 가져오기 (사진·PDF·엑셀·CSV → 저장하지 않은 견적서) */
  ai: {
    quota: () => apiFetch<AiQuota>("/ai/quota"),
    importFile: (file: Blob, filename: string, presetCode: string) => {
      const body = new FormData();
      body.append("file", file, filename);
      body.append("presetCode", presetCode);
      // 화면에서 동의를 받은 뒤에만 부른다
      body.append("consent", "true");
      return apiFetch<AiImportResult>("/ai/import/file", {
        method: "POST",
        body,
      });
    },
  },

  /** 자주 쓰는 품목. presetCode 가 없으면 모든 업종 */
  items: {
    list: (presetCode?: string, q?: string) => {
      const query = new URLSearchParams();
      if (presetCode) query.set("preset", presetCode);
      if (q) query.set("q", q);
      const qs = query.toString();
      return apiFetch<SavedItem[]>(`/items${qs ? `?${qs}` : ""}`);
    },
    create: (body: SavedItemRequest) =>
      apiFetch<SavedItem>("/items", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: number, body: SavedItemRequest) =>
      apiFetch<SavedItem>(`/items/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    remove: (id: number) =>
      apiFetch<void>(`/items/${id}`, { method: "DELETE" }),
  },

  documents: {
    list: (params: { status?: DocumentStatus; page?: number } = {}) => {
      const query = new URLSearchParams();
      if (params.status) query.set("status", params.status);
      if (params.page) query.set("page", String(params.page));
      const qs = query.toString();
      return apiFetch<PageResponse<DocumentSummary>>(
        `/documents${qs ? `?${qs}` : ""}`,
      );
    },
    get: (id: number) => apiFetch<DocumentResponse>(`/documents/${id}`),
    create: (body: DocumentCreateRequest) =>
      apiFetch<DocumentResponse>("/documents", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: number, body: DocumentUpdateRequest) =>
      apiFetch<DocumentResponse>(`/documents/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    changeStatus: (id: number, status: DocumentStatus) =>
      apiFetch<DocumentResponse>(`/documents/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    remove: (id: number) =>
      apiFetch<void>(`/documents/${id}`, { method: "DELETE" }),
    /**
     * 바로 한장에서 내려받은 엑셀을 다시 연다 (유료 기능). 저장하지 않은 문서(id 0)를 돌려준다
     */
    importXlsx: (file: File) => {
      const body = new FormData();
      body.append("file", file);
      return apiFetch<DocumentResponse>("/documents/import/xlsx", {
        method: "POST",
        body,
      });
    },
    /** 문서 변환 (유료 기능): 원본은 두고 거래명세서·청구서를 새로 만든다 */
    convert: (id: number, docType: DocType) =>
      apiFetch<DocumentResponse>(`/documents/${id}/convert`, {
        method: "POST",
        body: JSON.stringify({ docType }),
      }),
    /** 공유 링크 켜기. 이미 켜져 있으면 같은 주소 */
    share: (id: number) =>
      apiFetch<ShareInfo>(`/documents/${id}/share`, { method: "POST" }),
    /** 공유 링크 끄기. 다시 켜면 새 주소가 된다 */
    unshare: (id: number) =>
      apiFetch<void>(`/documents/${id}/share`, { method: "DELETE" }),
  },

  /** 로그인 없이 쓰는 주소 (공유 링크) */
  shared: {
    get: (token: string) =>
      apiFetch<SharedDocument>(
        `/public/documents/${encodeURIComponent(token)}`,
      ),
  },
};
