import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "내 문서" };

// TODO(3단계): GET /api/documents 로 목록을 불러온다.
export default function DocumentsPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">내 문서</h1>
        <Link
          href="/documents/new?preset=freelancer"
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          새 견적서
        </Link>
      </div>
      <p className="mt-10 text-center text-sm text-slate-500">
        아직 저장된 문서가 없습니다.
      </p>
    </div>
  );
}
