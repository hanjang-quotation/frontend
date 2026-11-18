"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BrandMark from "@/components/BrandMark";
import DocumentPreview from "@/components/document/DocumentPreview";
import { ApiError, api } from "@/lib/api/client";
import { formFromDocument, formTotals } from "@/lib/document/form";
import { DOC_TYPE_LABELS, type SharedDocument } from "@/lib/document/types";
import { partyView, type PartyFields } from "@/lib/party/types";
import { SITE } from "@/lib/site";

// 공유 링크 화면. 마지막으로 저장된 견적서를 미리보기와 같은 모양으로 보여 주고 PDF 로도 받게 한다.
// 열 때마다 서버가 열람 시각을 남긴다 (작성자 본인은 빼고).

type State =
  | { kind: "loading" }
  | { kind: "loaded"; doc: SharedDocument }
  | { kind: "gone" }
  | { kind: "error" };

export default function SharedView({ token }: { token: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    api.shared.get(token).then(
      (doc) => setState({ kind: "loaded", doc }),
      (e) =>
        setState(
          e instanceof ApiError && e.status === 404
            ? { kind: "gone" }
            : { kind: "error" },
        ),
    );
  }, [token]);

  return (
    <div className="min-h-dvh bg-desk">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
        {state.kind === "loading" && (
          <p className="py-20 text-center text-sm text-slate-500">
            견적서를 불러오는 중…
          </p>
        )}
        {state.kind === "gone" && (
          <Message
            title="열 수 없는 링크입니다"
            body="링크가 꺼졌거나 주소가 잘못되었습니다. 견적서를 보낸 분에게 다시 요청해 주세요."
          />
        )}
        {state.kind === "error" && (
          <Message
            title="견적서를 불러오지 못했습니다"
            body="잠시 후 다시 열어 주세요."
          />
        )}
        {state.kind === "loaded" && <Loaded doc={state.doc} token={token} />}

        <p className="mt-10 text-center text-xs text-slate-500">
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-ink"
          >
            <BrandMark />
          </Link>
        </p>
      </div>
    </div>
  );
}

function Loaded({ doc, token }: { doc: SharedDocument; token: string }) {
  const form = formFromDocument(doc);
  const heading = DOC_TYPE_LABELS[doc.docType];
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          {partyView(doc.partySnapshot.supplier as PartyFields | null).name ??
            SITE.name}
          에서 보낸 {heading}입니다.
        </p>
        <a
          href={`/api/public/documents/${encodeURIComponent(token)}/pdf`}
          className="rounded-md bg-pen px-3 py-1.5 text-sm font-medium text-white hover:bg-pen-deep"
        >
          PDF 내려받기
        </a>
      </div>
      <DocumentPreview
        preset={doc.presetSnapshot}
        form={form}
        totals={formTotals(form, doc.presetSnapshot)}
        docNo={doc.docNo}
        supplier={partyView(doc.partySnapshot.supplier as PartyFields | null)}
        supplierFields={doc.partySnapshot.supplier as PartyFields | null}
        docType={doc.docType}
      />
    </>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-rule bg-paper p-8 text-center">
      <h1 className="text-lg font-semibold text-ink">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  );
}
