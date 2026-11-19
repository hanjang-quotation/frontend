// 서버에서 그리는 이미지(대표 이미지·앱 아이콘)가 같이 쓰는 글꼴과 도장.
// 글꼴은 고운바탕에서 쓰는 글자만 담은 파일(assets/og, SIL OFL 1.1). 새 글자를 쓰려면 글꼴 파일을 다시 받는다

import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const BRAND = {
  desk: "#eceff3",
  paper: "#ffffff",
  ink: "#1a2233",
  pen: "#2647b5",
  seal: "#c9342b",
  rule: "#d3dae4",
} as const;

export async function gowunFonts() {
  const dir = join(process.cwd(), "assets/og");
  const [regular, bold] = await Promise.all([
    readFile(join(dir, "GowunBatang-Regular-subset.ttf")),
    readFile(join(dir, "GowunBatang-Bold-subset.ttf")),
  ]);
  return [
    {
      name: "Gowun Batang",
      data: regular,
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Gowun Batang",
      data: bold,
      weight: 700 as const,
      style: "normal" as const,
    },
  ];
}

/** 사각 도장, 글자는 세로로 "한장" (화면의 Seal 과 같은 모양). style 에 undefined 값을 넣으면 그리기가 실패하므로 빼고 넣는다 */
export function SealMark({
  size,
  font,
  border,
  background,
}: {
  size: number;
  font: number;
  border: number;
  background?: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: `${border}px solid ${BRAND.seal}`,
        borderRadius: size / 18,
        ...(background ? { background } : {}),
        color: BRAND.seal,
        fontFamily: "Gowun Batang",
        fontSize: font,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      <span>한</span>
      <span>장</span>
    </div>
  );
}
