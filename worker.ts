// Cloudflare Worker 입구. /api/* 는 Next.js 를 거치지 않고 백엔드(Spring)로 그대로 넘기고, 나머지는 OpenNext(Next.js)로 보낸다.
//
// 왜 직접 넘기나: next.config.ts 의 rewrites 를 OpenNext 가 처리하면 (1) 백엔드의 302 를 Worker 가 따라가 버려
// 카카오·구글 로그인 시작이 깨지고 (2) 압축된 답이 깨져서 온다. 여기서 redirect: "manual" 로 넘기면
// 302·Set-Cookie·압축이 브라우저까지 그대로 간다. (로컬 next dev 와 Vercel 은 지금처럼 rewrites 를 쓴다)

// worker.ts 는 tsconfig 에서 빠져 있다 (wrangler 가 묶을 때만 쓴다. Next 빌드에는 .open-next 가 없다)
import { default as handler } from "./.open-next/worker.js";

interface Env {
  /** 백엔드 주소. wrangler.jsonc 의 vars */
  BACKEND_URL: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      return proxyToBackend(request, url, env.BACKEND_URL);
    }
    return handler.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;

async function proxyToBackend(request: Request, url: URL, backend: string): Promise<Response> {
  const target = new URL(url.pathname + url.search, backend);
  const headers = new Headers(request.headers);
  // 백엔드가 원래 손님 정보를 알 수 있게 (Host 는 fetch 가 백엔드 주소로 바꾼다)
  headers.set("X-Forwarded-Host", url.host);
  headers.set("X-Forwarded-Proto", url.protocol.replace(":", ""));  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  return fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    // 백엔드의 302(로그인 시작·콜백)를 따라가지 않고 브라우저에 그대로 돌려준다
    redirect: "manual",
  });
}

// OpenNext 가 쓰는 Durable Object 들 (지금 설정에서는 쓰지 않지만 빌드 결과와 맞춰 둔다)
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";
