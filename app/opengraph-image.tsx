import { ImageResponse } from "next/og";
import { BRAND, SealMark as Seal, gowunFonts } from "@/lib/og";
import { SITE } from "@/lib/site";

// 링크를 붙였을 때(카톡·문자·SNS) 보이는 대표 이미지. 첫 화면처럼 책상 위 종이 한 장에 "한장" 도장을 찍었다.
// 글꼴은 고운바탕에서 쓰는 글자만 담은 파일(lib/og.tsx, assets/og).
// 글자를 바꾸면 새 글자가 빠져 보이지 않으므로 그 글자를 넣어 글꼴 파일을 다시 받는다 (Google Fonts css2 ?text=)

export const alt = `${SITE.name} — 업종별 견적서·거래명세서를 한 장으로`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const { desk: DESK, paper: PAPER, ink: INK, pen: PEN, rule: RULE } = BRAND;

export default async function Image() {
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
      fonts: await gowunFonts(),
    },
  );
}
