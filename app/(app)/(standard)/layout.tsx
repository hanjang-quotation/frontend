import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

// 내 문서 목록·내 정보·거래처 화면의 틀. 첫 화면(소개)과 같은 폭으로 가운데에 둔다.
// 견적서 작성·수정 화면만 (wide) 의 넓은 폭을 쓴다. 로그인 확인(접근 막기)은 아직 없다.
export default function StandardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-8">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
