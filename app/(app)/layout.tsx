import SiteHeader from "@/components/SiteHeader";

// 로그인 후 쓰는 화면들의 공통 틀. 작성 화면이 입력과 미리보기를 나란히 두므로 폭을 넓게 쓴다.
// 메뉴 줄도 같은 폭으로 맞춘다. 로그인 확인(접근 막기)은 아직 없다.
const WIDTH = "max-w-7xl 2xl:max-w-[1440px]";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader widthClass={WIDTH} />
      <main className={`mx-auto w-full ${WIDTH} flex-1 px-4 pt-4 pb-8`}>
        {children}
      </main>
    </>
  );
}
