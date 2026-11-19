import type { MetadataRoute } from "next";
import { industries } from "@/lib/preset/industries";
import { SITE } from "@/lib/site";

// 검색엔진에 알리는 공개 화면 목록. 업종을 추가하면 industries 에서 자동으로 들어간다
// 정적 내보내기(STATIC_EXPORT=1)에서도 파일로 만들어지도록
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const page = (
    path: string,
    priority: number,
  ): MetadataRoute.Sitemap[number] => ({
    url: `${SITE.url}${path}`,
    changeFrequency: "monthly",
    priority,
  });
  return [
    page("/", 1),
    ...industries.filter((i) => i.ready).map((i) => page(`/${i.code}`, 0.8)),
    page("/documents/new", 0.6),
    page("/pricing", 0.5),
    page("/terms", 0.2),
    page("/privacy", 0.2),
  ];
}
