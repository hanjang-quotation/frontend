import type { NextConfig } from "next";

// 백엔드(Spring Boot) 주소. 개발 중에는 내 컴퓨터의 8080 포트를 쓴다.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // 브라우저는 항상 이 사이트의 /api/* 로만 요청한다.
  // Next.js가 그 요청을 백엔드로 넘겨 주므로 로그인 쿠키가 같은 사이트 쿠키로 취급된다.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
