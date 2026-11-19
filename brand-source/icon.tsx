import { ImageResponse } from "next/og";
import { BRAND, SealMark, gowunFonts } from "./og";

// 브라우저 탭·북마크 아이콘: 로고의 "한장" 도장. 작은 크기에서도 보이게 종이 흰 바탕을 꽉 채운다.
// 128 은 화질 좋은 화면용이자 카카오 앱 아이콘 원본(assets/brand/app-icon-128.png 와 같은 그림)

export function generateImageMetadata() {
  return [
    { id: "32", size: { width: 32, height: 32 }, contentType: "image/png" },
    { id: "128", size: { width: 128, height: 128 }, contentType: "image/png" },
  ];
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const px = Number(await id);
  // 작은 아이콘은 테두리를 굵게, 여백 없이
  const small = px <= 48;
  const seal = small ? px : Math.round(px * 0.8);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: small ? "transparent" : BRAND.paper,
      }}
    >
      <SealMark
        size={seal}
        font={Math.round(seal * (small ? 0.42 : 0.38))}
        border={Math.max(2, Math.round(seal * (small ? 0.09 : 0.05)))}
        background={BRAND.paper}
      />
    </div>,
    { width: px, height: px, fonts: await gowunFonts() },
  );
}
