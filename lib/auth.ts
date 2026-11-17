// 로그인 흐름을 돕는 브라우저 쪽 함수들.

/** 백엔드 LoginSuccessHandler.RETURN_COOKIE 와 같아야 한다 */
const RETURN_COOKIE = "quotation_return";

/** 우리 사이트 안의 경로만 받는다 (백엔드 safeReturnPath 와 같은 규칙). 아니면 "/" */
export function safePath(path: string | null | undefined): string {
  if (
    !path ||
    path.length > 300 ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\")
  ) {
    return "/";
  }
  return path;
}

/**
 * 소셜 로그인 뒤 돌아갈 경로를 쿠키에 적어 둔다 (10분). 로그인 버튼을 누르기 직전에 부른다.
 * 쿠키는 이 사이트 주소에 붙고, 소셜 서비스에서 돌아올 때 /api/* 를 거쳐 백엔드로 함께 간다.
 */
export function rememberReturnPath(path: string): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${RETURN_COOKIE}=${encodeURIComponent(safePath(path))}; Path=/; Max-Age=600; SameSite=Lax${secure}`;
}

/**
 * 이 브라우저에서 마지막으로 로그인에 성공한 소셜 로그인. 카카오와 구글은 서로 다른 계정이라,
 * 로그인 화면에 "최근에 쓴 로그인"으로 표시해 다른 쪽으로 새로 가입하는 일을 줄인다.
 */
export type Provider = "KAKAO" | "GOOGLE";

const LAST_PROVIDER_KEY = "quotation:last-login-provider";
const LAST_PROVIDER_CHANGED = "quotation:last-provider-changed";

/** 로그인에 성공했을 때 부른다 (AuthMenu 가 /api/me 를 받은 뒤). 저장소를 못 쓰면 조용히 넘어간다 */
export function rememberLastProvider(provider: Provider): void {
  try {
    if (window.localStorage.getItem(LAST_PROVIDER_KEY) === provider) return;
    window.localStorage.setItem(LAST_PROVIDER_KEY, provider);
    window.dispatchEvent(new Event(LAST_PROVIDER_CHANGED));
  } catch {
    // 개인 정보 보호 모드 등
  }
}

/** useSyncExternalStore 용: 다른 탭에서 바뀐 것도 따라간다 */
export function subscribeLastProvider(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(LAST_PROVIDER_CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LAST_PROVIDER_CHANGED, onChange);
  };
}

export function readLastProvider(): Provider | null {
  try {
    const value = window.localStorage.getItem(LAST_PROVIDER_KEY);
    return value === "KAKAO" || value === "GOOGLE" ? value : null;
  } catch {
    return null;
  }
}

/**
 * 로그인 상태가 바뀌었다고 알린다 (로그아웃·동의·탈퇴). 메뉴 줄(AuthMenu)이 듣고 /api/me 를 다시 부른다.
 * 화면은 cacheComponents 때문에 다시 그려지지 않을 수 있어서 따로 알린다.
 */
export const AUTH_CHANGED = "quotation:auth-changed";

export function notifyAuthChanged(): void {
  window.dispatchEvent(new Event(AUTH_CHANGED));
}
