"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Field, inputClass } from "@/components/form";
import { api } from "@/lib/api/client";
import { errorMessages, loadError } from "@/lib/api/errors";
import { formatBusinessNo, formatPhone } from "@/lib/format";
import { partyView, type Client, type ClientRequest } from "@/lib/party/types";

// 거래처 관리 (TECH_SPEC 9.3). 저장해 두면 견적서 작성 화면에서 골라 쓸 수 있다.
// 담당자 이름·연락처는 제3자 개인정보라 모두 선택 입력이다. 고치거나 지워도 이미 만든 문서는 바뀌지 않는다.

type ListState =
  | { kind: "loading" }
  | { kind: "loaded"; clients: Client[] }
  | { kind: "error"; message: string; needLogin?: boolean };

/** 편집 중인 거래처. id 가 없으면 새로 만드는 중 */
type Editing = { id?: number; values: ClientValues } | null;

type ClientValues = Required<ClientRequest>;

const EMPTY: ClientValues = {
  name: "",
  contactName: "",
  phone: "",
  email: "",
  businessNo: "",
  address: "",
  memo: "",
};

function valuesOf(c: Client): ClientValues {
  return {
    name: c.name,
    contactName: c.contactName ?? "",
    phone: c.phone ?? "",
    email: c.email ?? "",
    businessNo: c.businessNo ?? "",
    address: c.address ?? "",
    memo: c.memo ?? "",
  };
}

export default function ClientSettings() {
  const [list, setList] = useState<ListState>({ kind: "loading" });
  const [query, setQuery] = useState("");
  /** 지금 목록에 적용된 검색어 */
  const [searched, setSearched] = useState("");
  const [editing, setEditing] = useState<Editing>(null);
  const [error, setError] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = (q: string) =>
    api.clients.list(q).then(
      (clients) => setList({ kind: "loaded", clients }),
      (e) => setList(loadError(e, "거래처")),
    );

  useEffect(() => {
    load("");
  }, []);

  function search(q: string) {
    setSearched(q.trim());
    setList({ kind: "loading" });
    load(q.trim());
  }

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      setEditing(null);
      await load(searched);
    } catch (e) {
      setError(errorMessages(e));
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (!editing) return;
    const body = { ...editing.values, name: editing.values.name.trim() };
    run(() =>
      editing.id === undefined
        ? api.clients.create(body)
        : api.clients.update(editing.id, body),
    );
  }

  function remove(c: Client) {
    if (
      !window.confirm(
        `"${c.name}" 거래처를 지울까요? 이미 만든 견적서는 그대로 남습니다.`,
      )
    )
      return;
    run(() => api.clients.remove(c.id));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">거래처</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            저장해 두면 견적서를 쓸 때 골라서 바로 채울 수 있습니다.
          </p>
        </div>
        {list.kind !== "error" && !editing && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setEditing({ values: EMPTY });
            }}
            className="shrink-0 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + 거래처 추가
          </button>
        )}
      </div>

      {error && (
        <ul
          role="alert"
          className="mt-4 list-disc rounded-md bg-red-50 py-3 pr-4 pl-8 text-sm text-red-700"
        >
          {error.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}

      {editing && (
        <ClientForm
          values={editing.values}
          isNew={editing.id === undefined}
          busy={busy}
          onChange={(values) => setEditing({ ...editing, values })}
          onSave={save}
          onCancel={() => {
            setEditing(null);
            setError(null);
          }}
        />
      )}

      {list.kind !== "error" && (
        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            search(query);
          }}
        >
          <input
            className={inputClass}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="상호로 찾기"
            aria-label="상호로 찾기"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md border border-slate-300 bg-white px-3 text-sm hover:bg-slate-50"
          >
            찾기
          </button>
        </form>
      )}

      {list.kind === "loading" && (
        <p className="mt-10 text-center text-sm text-slate-500">불러오는 중…</p>
      )}
      {list.kind === "error" && (
        <div className="mt-10 text-center text-sm text-slate-600">
          <p>{list.message}</p>
          {list.needLogin && (
            <Link
              href="/login"
              className="mt-3 inline-block text-blue-600 underline"
            >
              로그인하러 가기
            </Link>
          )}
        </div>
      )}

      {list.kind === "loaded" && list.clients.length === 0 && (
        <p className="mt-10 text-center text-sm text-slate-500">
          {searched
            ? `"${searched}"(이)가 들어간 거래처가 없습니다.`
            : "아직 저장한 거래처가 없습니다."}
        </p>
      )}

      {list.kind === "loaded" && list.clients.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {list.clients.map((c) => {
            const view = partyView(c);
            return (
              <li
                key={c.id}
                className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{c.name}</p>
                  {view.details && (
                    <p className="text-sm text-slate-600">{view.details}</p>
                  )}
                  {c.memo && (
                    <p className="text-xs text-slate-400">메모: {c.memo}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2 text-sm">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setError(null);
                      setEditing({ id: c.id, values: valuesOf(c) });
                    }}
                    className="rounded-md border border-slate-300 px-2.5 py-1 hover:bg-slate-50 disabled:opacity-50"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(c)}
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    삭제
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ClientForm({
  values: v,
  isNew,
  busy,
  onChange,
  onSave,
  onCancel,
}: {
  values: ClientValues;
  isNew: boolean;
  busy: boolean;
  onChange: (values: ClientValues) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const set = (patch: Partial<ClientValues>) => onChange({ ...v, ...patch });
  return (
    <form
      className="mt-6 space-y-4 rounded-xl border border-blue-200 bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <h2 className="text-sm font-semibold text-slate-900">
        {isNew ? "거래처 추가" : "거래처 수정"}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="상호 (필수)">
          <input
            className={inputClass}
            value={v.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="예: 가나다 주식회사"
          />
        </Field>
        <Field label="담당자">
          <input
            className={inputClass}
            value={v.contactName}
            onChange={(e) => set({ contactName: e.target.value })}
            placeholder="예: 홍길동"
          />
        </Field>
        <Field label="연락처">
          <input
            className={inputClass}
            type="tel"
            inputMode="tel"
            value={v.phone}
            onChange={(e) => set({ phone: formatPhone(e.target.value) })}
            placeholder="예: 010-1234-5678"
          />
        </Field>
        <Field label="이메일">
          <input
            className={inputClass}
            type="email"
            value={v.email}
            onChange={(e) => set({ email: e.target.value })}
            placeholder="예: contact@company.com"
          />
        </Field>
        <Field label="사업자등록번호">
          <input
            className={inputClass}
            inputMode="numeric"
            value={v.businessNo}
            onChange={(e) =>
              set({ businessNo: formatBusinessNo(e.target.value) })
            }
            placeholder="예: 123-45-67890"
          />
        </Field>
        <Field label="주소">
          <input
            className={inputClass}
            value={v.address}
            onChange={(e) => set({ address: e.target.value })}
            placeholder="예: 서울시 강남구 ○○로 34"
          />
        </Field>
      </div>
      <Field label="메모 (견적서에는 들어가지 않습니다)">
        <textarea
          className={`${inputClass} min-h-16`}
          value={v.memo}
          onChange={(e) => set({ memo: e.target.value })}
          placeholder="예: 월말 정산, 세금계산서 필요"
        />
      </Field>
      <p className="text-xs text-slate-500">
        담당자 이름·연락처는 꼭 필요할 때만 적어 주세요. 고쳐도 이미 만든
        견적서는 바뀌지 않습니다.
      </p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}
