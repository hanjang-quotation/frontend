import SiteHeader from "@/components/SiteHeader";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        계산 결과는 참고용이며 실제 세액과 다를 수 있습니다.
      </footer>
    </>
  );
}
