import SiteHeader from "@/components/SiteHeader";

// 견적서 작성·수정 화면의 틀. 입력과 미리보기를 나란히 두므로 폭을 넓게 쓴다. 메뉴 줄도 같은 폭으로 맞춘다.
// 다른 로그인 후 화면(목록·설정)은 (standard) 의 보통 폭을 쓴다. 로그인 확인(접근 막기)은 아직 없다.
const WIDTH = "max-w-7xl 2xl:max-w-[1440px]";

export default function WideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader widthClass={WIDTH} />
      <main className={`mx-auto w-full ${WIDTH} flex-1 px-4 pt-4 pb-8`}>
        {children}
      </main>
    </>
  );
}
