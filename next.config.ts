import type { NextConfig } from "next";

// 배포(Render Static Site)는 STATIC_EXPORT=1 로 빌드해 미리 만든 파일(out/)만 올린다.
// 그래서 배포에서는 Next.js 서버가 없고, /api 넘기기·보안 머리·주소 넘기기는 Render 설정에 있다
// (Redirects/Rewrites: /api/* → 백엔드, Headers: 보안 머리). 아래 rewrites 는 로컬 next dev 전용이다.
const STATIC_EXPORT = process.env.STATIC_EXPORT === "1";

// 로컬 개발 때 /api/* 를 넘길 백엔드 주소. 내 컴퓨터의 8080 포트
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  ...(STATIC_EXPORT ? { output: "export" as const } : {}),
  // Cache Components 는 쓰지 않는다 (정적 내보내기로 배포하고, 예전에 Cloudflare Workers 에서 화면 그리기를 멈추게 했다)
  cacheComponents: false,
  experimental: {
    // 로컬 개발 때 /api/* 를 백엔드로 넘기며 기다리는 시간. 기본 30초는 AI 로 읽기(길면 90초 남짓)에 모자란다
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
  // 브라우저는 항상 이 사이트의 /api/* 로만 요청한다 (로그인 쿠키가 같은 사이트 쿠키가 되게).
  // 로컬 next dev 에서는 Next.js 가, 배포에서는 Render 의 Rewrite 규칙이 백엔드로 넘긴다
  ...(STATIC_EXPORT
    ? {}
    : {
        async rewrites() {
          return [
            {
              source: "/api/:path*",
              destination: `${BACKEND_URL}/api/:path*`,
            },
          ];
        },
      }),
};

export default nextConfig;
