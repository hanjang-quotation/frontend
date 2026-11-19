import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// 검색엔진에는 소개·약관 화면과 새 견적서 쓰기만 보인다.
// 로그인해야 보이는 화면, 공유 링크(/s), API 는 막는다 (공유 링크는 화면에서도 noindex)
// 정적 내보내기(STATIC_EXPORT=1)에서도 파일로 만들어지도록
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/documents/new"],
      disallow: [
        "/api/",
        // 공유 링크(/s?t=토큰)만 막는다. "/s" 로 쓰면 /sitemap.xml 처럼 s 로 시작하는 주소까지 막힌다
        "/s$",
        "/s?",
        "/documents/",
        "/settings/",
        "/welcome",
        "/login",
      ],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
