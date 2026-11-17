"use client";

import { useState } from "react";
import { ApiError, api } from "@/lib/api/client";
import { STATUS_LABELS, type DocumentStatus } from "@/lib/document/types";

// 문서 상태(작성 중 → 보냄 → 수락됨 → 입금 완료 …). 고르는 즉시 서버에 저장한다.
// 내용 저장(저장 버튼)과는 따로 동작해서, 저장하지 않은 수정 내용에는 영향이 없다.
export default function StatusSelect({
  documentId,
  initialStatus,
}: {
  documentId: number;
  initialStatus: DocumentStatus;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: DocumentStatus) {
    const previous = status;
    setStatus(next);
    setPending(true);
    setError(null);
    try {
      const updated = await api.documents.changeStatus(documentId, next);
      setStatus(updated.status);
    } catch (e) {
      setStatus(previous);
      setError(
        e instanceof ApiError && e.status === 401
          ? "로그인이 필요합니다."
          : "상태를 바꾸지 못했습니다.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-slate-600">상태</span>
      <select
        className="rounded-md border border-slate-300 bg-paper px-2 py-1.5 text-sm focus:border-pen focus:outline-none disabled:opacity-60"
        value={status}
        disabled={pending}
        onChange={(e) => change(e.target.value as DocumentStatus)}
      >
        {(Object.keys(STATUS_LABELS) as DocumentStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {error && <span className="text-red-600">{error}</span>}
    </label>
  );
}
