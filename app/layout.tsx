import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "업종별 견적서 만들기",
    template: "%s | 업종별 견적서 만들기",
  },
  description:
    "업종에 맞는 항목으로 견적서와 거래명세서를 작성하고 PDF로 내려받으세요.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
