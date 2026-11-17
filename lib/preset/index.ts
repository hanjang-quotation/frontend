// 프론트에 둔 업종 설정 목록. 업종을 추가하면 설정 파일을 만들고 여기에 한 줄 더한다.
// 각 설정은 백엔드 presets 테이블의 최신 버전과 내용이 같아야 한다 (CLAUDE.md "지켜야 할 규칙").

import { constructionPreset } from "./construction";
import { eventPreset } from "./event";
import { freelancerPreset } from "./freelancer";
import type { Preset } from "./types";

export const PRESETS: Record<string, Preset> = {
  [freelancerPreset.code]: freelancerPreset,
  [eventPreset.code]: eventPreset,
  [constructionPreset.code]: constructionPreset,
};

/** code 에 맞는 업종 설정. 없으면 undefined */
export function presetOf(code: string | null | undefined): Preset | undefined {
  return code ? PRESETS[code] : undefined;
}
