"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api/client";
import { formFromDocument } from "@/lib/document/form";
import type { DocumentResponse } from "@/lib/document/types";
import DocumentEditor from "../DocumentEditor";

// 저장된 문서를 불러와 작성 화면에 넣는다. 업종 설정은 문서에 저장된 스냅샷을 쓴다.
type State =
  | { kind: "loading" }
  | { kind: "loaded"; doc: DocumentResponse }
  | { kind: "error"; message: string; needLogin?: boolean };

export default function EditDocument({ id }: { id: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const documentId = Number(id);
    if (!Number.isInteger(documentId)) {
      // 숫자가 아닌 주소는 서버에 묻지 않는다
      Promise.resolve().then(() =>
        setState({ kind: "error", message: "문서를 찾을 수 없습니다." }),
      );
      return;
    }
    api.documents.get(documentId).then(
      (doc) => setState({ kind: "loaded", doc }),
      (e) => setState(loadError(e)),
    );
  }, [id]);

  if (state.kind === "loading") {
    return <p className="text-sm text-slate-500">문서를 불러오는 중…</p>;
  }
  if (state.kind === "error") {
    return (
      <div className="py-10 text-center text-sm text-slate-600">
        <p>{state.message}</p>
        <Link
          href={state.needLogin ? "/login" : "/documents"}
          className="mt-3 inline-block text-blue-600 underline"
        >
          {state.needLogin ? "로그인하러 가기" : "내 문서로"}
        </Link>
      </div>
    );
  }

  const { doc } = state;
  return (
    <DocumentEditor
      preset={doc.presetSnapshot}
      initial={formFromDocument(doc)}
      documentId={doc.id}
      docNo={doc.docNo}
    />
  );
}

function loadError(e: unknown): State {
  if (e instanceof ApiError && e.status === 401) {
    return { kind: "error", message: "로그인이 필요합니다.", needLogin: true };
  }
  if (e instanceof ApiError && e.status === 404) {
    return { kind: "error", message: "문서를 찾을 수 없습니다." };
  }
  return { kind: "error", message: "문서를 불러오지 못했습니다." };
}
