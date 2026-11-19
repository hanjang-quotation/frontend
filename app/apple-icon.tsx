import { ImageResponse } from "next/og";
import { BRAND, SealMark, gowunFonts } from "@/lib/og";

// 아이폰 홈 화면에 추가할 때의 아이콘 (iOS 가 모서리를 둥글게 깎는다)
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND.paper,
      }}
    >
      <SealMark size={136} font={52} border={7} />
    </div>,
    { ...size, fonts: await gowunFonts() },
  );
}
