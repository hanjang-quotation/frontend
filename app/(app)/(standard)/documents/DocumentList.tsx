"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api/client";
import { formatWon } from "@/lib/calc";
import {
  STATUS_LABELS,
  type DocumentStatus,
  type DocumentSummary,
  type PageResponse,
} from "@/lib/document/types";
import { formatDate, formatDateTimeShort } from "@/lib/format";

// 내 문서 목록 (TECH_SPEC 10장). 상태별 탭, 최근 수정한 순서, 한 쪽에 20건.
// 세션 쿠키가 필요해 브라우저에서 불러온다.

const TABS: { status?: DocumentStatus; label: string }[] = [
  { label: "전체" },
  ...(Object.keys(STATUS_LABELS) as DocumentStatus[]).map((status) => ({
    status,
    label: STATUS_LABELS[status],
  })),
];

type State =
  | { kind: "loading" }
  | { kind: "loaded"; data: PageResponse<DocumentSummary> }
  | { kind: "error"; message: string; needLogin?: boolean };

export default function DocumentList() {
  const [status, setStatus] = useState<DocumentStatus | undefined>();
  const [page, setPage] = useState(0);
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let current = true;
    api.documents.list({ status, page }).then(
      (data) => current && setState({ kind: "loaded", data }),
      (e) =>
        current &&
        setState(
          e instanceof ApiError && e.status === 401
            ? {
                kind: "error",
                message: "로그인하면 저장한 문서를 볼 수 있습니다.",
                needLogin: true,
              }
            : { kind: "error", message: "목록을 불러오지 못했습니다." },
        ),
    );
    return () => {
      current = false;
    };
  }, [status, page]);

  function selectTab(next: DocumentStatus | undefined) {
    setStatus(next);
    setPage(0);
    setState({ kind: "loading" });
  }

  function goToPage(next: number) {
    setPage(next);
    setState({ kind: "loading" });
  }

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

      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-slate-200 text-sm">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => selectTab(tab.status)}
            className={`shrink-0 border-b-2 px-3 py-2 ${
              status === tab.status
                ? "border-blue-600 font-medium text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {state.kind === "loading" && (
        <p className="mt-10 text-center text-sm text-slate-500">불러오는 중…</p>
      )}

      {state.kind === "error" && (
        <div className="mt-10 text-center text-sm text-slate-600">
          <p>{state.message}</p>
          {state.needLogin && (
            <Link
              href="/login"
              className="mt-3 inline-block text-blue-600 underline"
            >
              로그인하러 가기
            </Link>
          )}
        </div>
      )}

      {state.kind === "loaded" && state.data.items.length === 0 && (
        <p className="mt-10 text-center text-sm text-slate-500">
          {status
            ? "이 상태의 문서가 없습니다."
            : "아직 저장된 문서가 없습니다."}
        </p>
      )}

      {state.kind === "loaded" && state.data.items.length > 0 && (
        <>
          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {state.data.items.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/documents/${doc.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">
                      {doc.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="tabular-nums">{doc.docNo}</span>
                      {doc.clientName && <> · {doc.clientName}</>}
                      {" · "}
                      작성일 {formatDate(doc.issueDate)}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {STATUS_LABELS[doc.status]}
                  </span>
                  <div className="w-32 text-right">
                    <p className="font-medium tabular-nums text-slate-900">
                      {formatWon(doc.totalAmount)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDateTimeShort(doc.updatedAt)} 수정
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {state.data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => goToPage(page - 1)}
                className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                이전
              </button>
              <span className="tabular-nums text-slate-600">
                {page + 1} / {state.data.totalPages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= state.data.totalPages}
                onClick={() => goToPage(page + 1)}
                className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
