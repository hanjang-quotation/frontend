import type { Metadata } from "next";
import { Gowun_Batang } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";

// 큰 제목·로고용 명조. 한글 글자 파일은 쓰일 때 받아 온다 (latin 만 미리 받기)
const gowun = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-gowun",
});

export const metadata: Metadata = {
  // 공유 미리보기·canonical 의 상대 주소를 이 주소 기준으로 만든다
  metadataBase: new URL(SITE.url),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE.name,
  },
  // 대표 이미지는 app/opengraph-image.tsx. 트위터(X)도 큰 그림으로
  twitter: { card: "summary_large_image" },
  title: {
    default: `${SITE.name} — 업종별 견적서`,
    template: `%s | ${SITE.name}`,
  },
  description:
    "업종에 맞는 항목으로 견적서를 쓰고, 합계와 세금을 자동으로 계산해 PDF 한 장으로 내려받으세요.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`h-full antialiased ${gowun.variable}`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
