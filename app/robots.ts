import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// 검색엔진에는 소개·약관 화면과 새 견적서 쓰기만 보인다.
// 로그인해야 보이는 화면, 공유 링크(/s), API 는 막는다 (공유 링크는 화면에서도 noindex)
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/documents/new"],
      disallow: [
        "/api/",
        "/s/",
        "/documents/",
        "/settings/",
        "/welcome",
        "/login",
      ],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
