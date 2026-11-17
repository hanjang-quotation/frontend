"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Field, inputClass } from "@/components/form";
import { api } from "@/lib/api/client";
import { errorMessages, loadError } from "@/lib/api/errors";
import { TAX_MODE_LABELS, type TaxMode } from "@/lib/calc";
import { formatBusinessNo, formatPhone } from "@/lib/format";
import {
  partyView,
  type Profile,
  type ProfileRequest,
} from "@/lib/party/types";

// 내 정보(공급자) 관리 (TECH_SPEC 9.2). 여러 개 둘 수 있고 하나가 기본이다.
// 기본 내 정보는 새 견적서의 공급자로 먼저 골라진다. 고쳐도 이미 만든 문서는 바뀌지 않는다.

type ListState =
  | { kind: "loading" }
  | { kind: "loaded"; profiles: Profile[] }
  | { kind: "error"; message: string; needLogin?: boolean };

/** 편집 중인 내 정보. id 가 없으면 새로 만드는 중 */
type Editing = { id?: number; values: ProfileValues } | null;

interface ProfileValues {
  name: string;
  representative: string;
  businessNo: string;
  phone: string;
  email: string;
  address: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  taxType: TaxMode;
}

const EMPTY: ProfileValues = {
  name: "",
  representative: "",
  businessNo: "",
  phone: "",
  email: "",
  address: "",
  bankName: "",
  bankAccount: "",
  bankHolder: "",
  taxType: "WITHHOLDING_3_3",
};

function valuesOf(p: Profile): ProfileValues {
  return {
    name: p.name,
    representative: p.representative ?? "",
    businessNo: p.businessNo ?? "",
    phone: p.phone ?? "",
    email: p.email ?? "",
    address: p.address ?? "",
    bankName: p.bankName ?? "",
    bankAccount: p.bankAccount ?? "",
    bankHolder: p.bankHolder ?? "",
    taxType: p.taxType,
  };
}

function toRequest(v: ProfileValues): ProfileRequest {
  return {
    ...v,
    name: v.name.trim(),
  };
}

export default function ProfileSettings() {
  const [list, setList] = useState<ListState>({ kind: "loading" });
  const [editing, setEditing] = useState<Editing>(null);
  const [error, setError] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () =>
    api.profiles.list().then(
      (profiles) => setList({ kind: "loaded", profiles }),
      (e) => setList(loadError(e, "내 정보")),
    );

  useEffect(() => {
    reload();
  }, []);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      setEditing(null);
      await reload();
    } catch (e) {
      setError(errorMessages(e));
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (!editing) return;
    const body = toRequest(editing.values);
    run(() =>
      editing.id === undefined
        ? api.profiles.create(body)
        : api.profiles.update(editing.id, body),
    );
  }

  function makeDefault(p: Profile) {
    run(() =>
      api.profiles.update(p.id, { ...toRequest(valuesOf(p)), isDefault: true }),
    );
  }

  function remove(p: Profile) {
    if (
      !window.confirm(
        `"${p.name}" 내 정보를 지울까요? 이미 만든 견적서는 그대로 남습니다.`,
      )
    )
      return;
    run(() => api.profiles.remove(p.id));
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">내 정보</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            견적서의 공급자 칸에 들어갑니다. 기본 내 정보가 새 견적서에 먼저
            골라집니다.
          </p>
        </div>
        {list.kind === "loaded" && !editing && (
          <button
            type="button"
            onClick={() => setEditing({ values: EMPTY })}
            className="shrink-0 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + 내 정보 추가
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

      {editing && (
        <ProfileForm
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

      {list.kind === "loaded" && list.profiles.length === 0 && !editing && (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          <p>아직 등록한 내 정보가 없습니다.</p>
          <p className="mt-1">
            상호·연락처·입금 계좌를 등록해 두면 견적서에 자동으로 들어갑니다.
          </p>
        </div>
      )}

      {list.kind === "loaded" && list.profiles.length > 0 && (
        <ul className="mt-6 space-y-3">
          {list.profiles.map((p) => {
            const view = partyView(p);
            return (
              <li
                key={p.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {p.name}
                      {p.isDefault && (
                        <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          기본
                        </span>
                      )}
                    </p>
                    {view.details && (
                      <p className="mt-1 text-sm text-slate-600">
                        {view.details}
                      </p>
                    )}
                    {view.bank && (
                      <p className="text-sm text-slate-600">
                        입금 계좌 {view.bank}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      기본 세금 방식: {TAX_MODE_LABELS[p.taxType]}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2 text-sm">
                    {!p.isDefault && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => makeDefault(p)}
                        className="rounded-md border border-slate-300 px-2.5 py-1 hover:bg-slate-50 disabled:opacity-50"
                      >
                        기본으로
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setError(null);
                        setEditing({ id: p.id, values: valuesOf(p) });
                      }}
                      className="rounded-md border border-slate-300 px-2.5 py-1 hover:bg-slate-50 disabled:opacity-50"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => remove(p)}
                      className="rounded-md border border-slate-300 px-2.5 py-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ProfileForm({
  values: v,
  isNew,
  busy,
  onChange,
  onSave,
  onCancel,
}: {
  values: ProfileValues;
  isNew: boolean;
  busy: boolean;
  onChange: (values: ProfileValues) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const set = (patch: Partial<ProfileValues>) => onChange({ ...v, ...patch });
  return (
    <form
      className="mt-6 space-y-4 rounded-xl border border-blue-200 bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <h2 className="text-sm font-semibold text-slate-900">
        {isNew ? "내 정보 추가" : "내 정보 수정"}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="상호 또는 이름 (필수)">
          <input
            className={inputClass}
            value={v.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="예: 한장 디자인"
          />
        </Field>
        <Field label="대표자">
          <input
            className={inputClass}
            value={v.representative}
            onChange={(e) => set({ representative: e.target.value })}
            placeholder="예: 김한장"
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
            placeholder="예: 123-45-67890 (없으면 비워 두세요)"
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
            placeholder="예: hello@mystudio.kr"
          />
        </Field>
        <Field label="주소">
          <input
            className={inputClass}
            value={v.address}
            onChange={(e) => set({ address: e.target.value })}
            placeholder="예: 서울시 마포구 ○○로 12"
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="은행">
          <input
            className={inputClass}
            value={v.bankName}
            onChange={(e) => set({ bankName: e.target.value })}
            placeholder="예: 국민은행"
          />
        </Field>
        <Field label="계좌번호">
          <input
            className={inputClass}
            inputMode="numeric"
            value={v.bankAccount}
            onChange={(e) => set({ bankAccount: e.target.value })}
            placeholder="예: 123456-01-234567"
          />
        </Field>
        <Field label="예금주">
          <input
            className={inputClass}
            value={v.bankHolder}
            onChange={(e) => set({ bankHolder: e.target.value })}
            placeholder="예: 김한장"
          />
        </Field>
      </div>

      <Field label="새 견적서의 기본 세금 방식">
        <select
          className={`${inputClass} sm:max-w-xs`}
          value={v.taxType}
          onChange={(e) => set({ taxType: e.target.value as TaxMode })}
        >
          {(Object.keys(TAX_MODE_LABELS) as TaxMode[]).map((m) => (
            <option key={m} value={m}>
              {TAX_MODE_LABELS[m]}
            </option>
          ))}
        </select>
      </Field>

      <p className="text-xs text-slate-500">
        주민등록번호는 받지 않습니다. 고쳐도 이미 만든 견적서는 바뀌지 않습니다.
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
