// OpenNext(Cloudflare) 설정. 다시 검증(revalidate)하는 화면이 없어서
// 빌드 때 만든 정적 화면을 그대로 읽는 캐시를 쓴다 (R2 같은 추가 저장소가 필요 없다)
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
