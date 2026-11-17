import SiteHeader from "@/components/SiteHeader";

// 로그인 후 쓰는 화면들의 공통 틀. 로그인 확인은 1단계(소셜 로그인)에서 붙인다.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 pb-8">
        {children}
      </main>
    </>
  );
}
