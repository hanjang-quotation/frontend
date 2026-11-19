import type { NextConfig } from "next";

// 백엔드(Spring Boot) 주소. 개발 중에는 내 컴퓨터의 8080 포트를 쓴다.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

// STATIC_EXPORT=1 이면 미리 만든 파일만으로 띄운다 (Render Static Site 등. 결과는 out/).
// 이때는 아래 headers·redirects·rewrites 가 동작하지 않으므로 호스팅 설정(Render 대시보드의 Redirects/Rewrites·Headers)으로 옮긴다.
// 없으면 지금처럼 Next.js 서버로 띄운다 (next dev, Vercel)
const STATIC_EXPORT = process.env.STATIC_EXPORT === "1";

// 모든 화면에 붙이는 보안 머리. 다른 사이트가 우리 화면을 틀(iframe) 안에 넣지 못하게 하고,
// 파일 형식을 브라우저가 멋대로 짐작하지 않게 한다. 공유 링크(/s)는 화면에서 no-referrer 를 따로 정한다
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // Cache Components 는 끈다: Cloudflare Workers(OpenNext)에서 켜면 화면 그리기가 멈춘다
  // ("Next.js cannot guarantee that Cache Components will run as expected due to the current runtime's implementation of setTimeout()")
  cacheComponents: false,
  ...(STATIC_EXPORT ? { output: "export" as const } : {}),
  experimental: {
    // /api/* 를 백엔드로 넘길 때 기다리는 시간. 기본 30초는 AI 로 사진 읽기(보통 10~60초)에 모자란다.
    // 백엔드가 전체를 100초 안쪽으로 끝내므로 그보다 길게 둔다
    proxyTimeout: 120_000,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  ...(STATIC_EXPORT
    ? {}
    : {
        async headers() {
          return [{ source: "/:path*", headers: SECURITY_HEADERS }];
        },
        async redirects() {
          return [
            // 예전 Vercel 주소로 오면 새 도메인으로 영구 이동한다 (로그인 쿠키·콜백이 새 도메인 기준이라 한 주소만 쓴다).
            // 미리보기 배포(다른 *.vercel.app 주소)는 그대로 둔다
            {
              source: "/:path*",
              has: [
                { type: "host", value: "frontend-gamma-six-74.vercel.app" },
              ],
              destination: "https://barohanjang.com/:path*",
              permanent: true,
            },
            // 예전 주소 형식 → 쿼리 형식 (lib/paths.ts). 이미 보낸 공유 링크·즐겨찾기가 계속 열린다
            {
              source: "/documents/:id(\\d+)",
              destination: "/documents/edit?id=:id",
              permanent: true,
            },
            {
              source: "/s/:token",
              destination: "/s?t=:token",
              permanent: true,
            },
          ];
        },
        // 브라우저는 항상 이 사이트의 /api/* 로만 요청한다.
        // Next.js가 그 요청을 백엔드로 넘겨 주므로 로그인 쿠키가 같은 사이트 쿠키로 취급된다.
        async rewrites() {
          return [
            { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
          ];
        },
      }),
};

export default nextConfig;
