import type { Metadata } from "next";

export const metadata: Metadata = { title: "내 정보" };

// TODO(6단계): /api/profiles 로 상호·연락처·입금 계좌를 관리한다.
export default function ProfileSettingsPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">내 정보</h1>
      <p className="mt-4 text-sm text-slate-500">
        견적서에 들어갈 내 상호와 연락처를 여기서 관리합니다. (준비 중)
      </p>
    </div>
  );
}
