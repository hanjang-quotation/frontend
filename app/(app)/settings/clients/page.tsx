import type { Metadata } from "next";

export const metadata: Metadata = { title: "거래처" };

// TODO(6단계): /api/clients 로 거래처를 관리한다.
export default function ClientSettingsPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">거래처</h1>
      <p className="mt-4 text-sm text-slate-500">
        자주 쓰는 거래처를 저장해 두는 곳입니다. (준비 중)
      </p>
    </div>
  );
}
