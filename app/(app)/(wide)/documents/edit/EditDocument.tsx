"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api/client";
import { formFromDocument } from "@/lib/document/form";
import type { DocumentResponse } from "@/lib/document/types";
import { formatTime } from "@/lib/format";
import { documentPath } from "@/lib/paths";
import DocumentEditor from "../DocumentEditor";

// 저장된 문서를 불러와 작성 화면에 넣는다. 업종 설정은 문서에 저장된 스냅샷을 쓴다.
// 새 문서를 저장하고 넘어오면 ?saved=1 이 붙어 있어 저장 안내를 띄운다.
type State =
  | { kind: "loading" }
  | { kind: "loaded"; doc: DocumentResponse }
  | { kind: "error"; message: string; needLogin?: boolean };

export default function EditDocument() {
  // 처음 열릴 때 한 번만 읽는다. 아래에서 주소의 ?saved 를 지우면 useSearchParams 값도 바로 바뀌기 때문이다
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const [justSaved] = useState(() => searchParams.has("saved"));
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

  // 새로고침했을 때 안내가 다시 뜨지 않도록 주소에서 ?saved 를 지운다
  useEffect(() => {
    if (justSaved) window.history.replaceState(null, "", documentPath(id));
  }, [justSaved, id]);

  if (state.kind === "loading") {
    return <p className="text-sm text-slate-500">문서를 불러오는 중…</p>;
  }
  if (state.kind === "error") {
    return (
      <div className="py-10 text-center text-sm text-slate-600">
        <p>{state.message}</p>
        <Link
          href={state.needLogin ? "/login" : "/documents"}
          className="mt-3 inline-block text-pen underline"
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
      status={doc.status}
      keptSupplier={doc.partySnapshot.supplier}
      savedAt={justSaved ? formatTime(doc.updatedAt) : undefined}
      initialShare={doc.share}
      docType={doc.docType}
      source={doc.source}
      derived={doc.derived}
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
