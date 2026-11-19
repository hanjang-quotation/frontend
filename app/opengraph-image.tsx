import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

// 링크를 붙였을 때(카톡·문자·SNS) 보이는 대표 이미지. 첫 화면처럼 책상 위 종이 한 장에 "한장" 도장을 찍었다.
// 글꼴은 고운바탕에서 이 이미지에 쓰는 글자만 담은 파일(assets/og, SIL OFL 1.1).
// 글자를 바꾸면 새 글자가 빠져 보이지 않으므로 그 글자를 넣어 글꼴 파일을 다시 받는다 (Google Fonts css2 ?text=)

export const alt = `${SITE.name} — 업종별 견적서·거래명세서를 한 장으로`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const DESK = "#eceff3";
const PAPER = "#ffffff";
const INK = "#1a2233";
const PEN = "#2647b5";
const SEAL = "#c9342b";
const RULE = "#d3dae4";

function Seal({
  size,
  font,
  border,
}: {
  size: number;
  font: number;
  border: number;
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
        border: `${border}px solid ${SEAL}`,
        borderRadius: size / 18,
        color: SEAL,
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

export default async function Image() {
  const dir = join(process.cwd(), "assets/og");
  const [regular, bold] = await Promise.all([
    readFile(join(dir, "GowunBatang-Regular-subset.ttf")),
    readFile(join(dir, "GowunBatang-Bold-subset.ttf")),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        background: DESK,
        fontFamily: "Gowun Batang",
        color: INK,
        padding: "0 80px",
      }}
    >
      {/* 왼쪽: 이름과 한 줄 소개 */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Seal size={64} font={24} border={3} />
          <span style={{ fontSize: 40, fontWeight: 700 }}>{SITE.name}</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 44,
            fontSize: 54,
            fontWeight: 700,
            lineHeight: 1.25,
          }}
        >
          <span>업종별 견적서·거래명세서를</span>
          <span>한 장으로</span>
        </div>
        <span style={{ marginTop: 32, fontSize: 30, color: PEN }}>
          합계와 세금은 자동으로 · PDF 엑셀
        </span>
      </div>

      {/* 오른쪽: 종이 한 장과 도장 */}
      <div
        style={{
          display: "flex",
          position: "relative",
          width: 340,
          height: 460,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 340,
            height: 460,
            background: PAPER,
            border: `1px solid ${RULE}`,
            boxShadow: "0 18px 40px rgba(26, 34, 51, 0.12)",
            padding: "44px 36px",
            transform: "rotate(2deg)",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 120,
              height: 14,
              background: INK,
              opacity: 0.85,
            }}
          />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                display: "flex",
                marginTop: i === 0 ? 40 : 22,
                height: 10,
                width: i % 3 === 2 ? 170 : 268,
                background: RULE,
              }}
            />
          ))}
          <div
            style={{
              display: "flex",
              marginTop: 40,
              alignSelf: "flex-end",
              width: 120,
              height: 12,
              background: PEN,
              opacity: 0.8,
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            right: -30,
            bottom: 40,
            transform: "rotate(-8deg)",
            opacity: 0.88,
          }}
        >
          <Seal size={150} font={58} border={6} />
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Gowun Batang", data: regular, weight: 400, style: "normal" },
        { name: "Gowun Batang", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}
