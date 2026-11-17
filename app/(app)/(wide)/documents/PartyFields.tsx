"use client";

import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { Field, Section, inputClass as input } from "@/components/form";
import { api } from "@/lib/api/client";
import { errorMessages } from "@/lib/api/errors";
import type { ClientForm } from "@/lib/document/form";
import { formatBusinessNo, formatPhone } from "@/lib/format";
import type { Client, PartyView, Profile } from "@/lib/party/types";

// 작성 화면의 내 정보(공급자)·거래처 입력. 문서에는 저장할 때 그 시점의 값이 스냅샷으로 들어간다.

/**
 * 공급자로 쓸 내 정보 고르기.
 * keptSupplier: 고른 내 정보가 없을 때 문서에 남아 있는 공급자(내 정보를 지운 예전 문서). 있으면 "유지"로 보여 준다.
 */
export function SupplierSection({
  profiles,
  profileId,
  keptSupplier,
  guest,
  onChange,
}: {
  profiles: Profile[] | null;
  profileId: number | null | undefined;
  keptSupplier: PartyView | null;
  /** 로그인하지 않았으면 true. 내 정보는 로그인해야 쓸 수 있다 */
  guest: boolean;
  onChange: (profileId: number | null) => void;
}) {
  if (guest) {
    return (
      <Section title="내 정보 (공급자)">
        <p className="text-sm text-slate-600">
          로그인하면 내 상호·연락처·입금 계좌를 골라 넣을 수 있습니다. 지금
          작성하는 내용은 이 브라우저에 임시로 보관되어, 저장할 때 로그인해도
          그대로 이어집니다.
        </p>
      </Section>
    );
  }
  return (
    <Section
      title="내 정보 (공급자)"
      action={
        <Link
          href="/settings/profile"
          className="text-xs text-slate-500 hover:text-ink"
        >
          내 정보 관리
        </Link>
      }
    >
      {profiles === null ? (
        <p className="text-sm text-slate-500">불러오는 중…</p>
      ) : profiles.length === 0 && !keptSupplier?.name ? (
        <p className="text-sm text-slate-600">
          등록한 내 정보가 없습니다.{" "}
          <Link
            href="/settings/profile"
            className="font-medium text-pen underline"
          >
            내 정보 등록하기
          </Link>
          <span className="block text-xs text-slate-400">
            상호·연락처·입금 계좌가 견적서의 공급자 칸에 들어갑니다. 등록하고
            돌아와도 쓰던 내용은 그대로 남아 있습니다.
          </span>
        </p>
      ) : (
        <select
          className={input}
          aria-label="공급자로 쓸 내 정보"
          value={profileId ?? ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
        >
          <option value="">
            {keptSupplier?.name
              ? `저장된 공급자 정보 유지 (${keptSupplier.name})`
              : "선택 안 함"}
          </option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.isDefault ? " (기본)" : ""}
            </option>
          ))}
        </select>
      )}
    </Section>
  );
}

/**
 * 거래처 입력. 저장된 거래처를 고르면 칸을 채우고 id 를 기억한다.
 * 칸을 고치면 직접 입력으로 바뀐다(id 를 지운다). 직접 입력한 거래처는 목록에 저장할 수 있다.
 */
export function ClientSection({
  clients,
  client,
  guest,
  onChange,
  onClientSaved,
}: {
  clients: Client[] | null;
  client: ClientForm;
  /** 로그인하지 않았으면 true. 거래처 목록에 저장할 수 없으므로 그 버튼을 숨긴다 */
  guest: boolean;
  onChange: (client: ClientForm) => void;
  /** 거래처 목록에 새로 저장했을 때 (목록을 갱신하라고 알린다) */
  onClientSaved: (saved: Client) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // 다른 화면에 다녀오면(cacheComponents 가 이 화면을 숨겼다가 다시 보여 줄 때) 지난 안내 문구를 지운다
  useLayoutEffect(() => {
    return () => setMessage(null);
  }, []);

  /** 칸을 고치면 저장된 거래처와 달라지므로 직접 입력으로 바꾼다 */
  const edit = (patch: Partial<ClientForm>) => {
    setMessage(null);
    onChange({ ...client, ...patch, id: null });
  };

  function pick(id: string) {
    setMessage(null);
    const found = clients?.find((c) => c.id === Number(id));
    if (!found) return;
    onChange({
      id: found.id,
      name: found.name,
      contactName: found.contactName ?? "",
      phone: found.phone ?? "",
      email: found.email ?? "",
      businessNo: found.businessNo ?? "",
      address: found.address ?? "",
    });
  }

  async function saveToList() {
    setSaving(true);
    setMessage(null);
    try {
      const saved = await api.clients.create({
        name: client.name.trim(),
        contactName: client.contactName,
        phone: client.phone,
        email: client.email,
        businessNo: client.businessNo,
        address: client.address,
      });
      onClientSaved(saved);
      onChange({ ...client, id: saved.id });
      setMessage("거래처 목록에 저장했습니다.");
    } catch (e) {
      setMessage(errorMessages(e).join(" "));
    } finally {
      setSaving(false);
    }
  }

  const picked = client.id !== null;

  return (
    <Section
      title="거래처"
      action={
        <Link
          href="/settings/clients"
          className="text-xs text-slate-500 hover:text-ink"
        >
          거래처 관리
        </Link>
      }
    >
      {clients && clients.length > 0 && (
        <select
          className={`${input} mb-3`}
          aria-label="저장된 거래처에서 고르기"
          value={client.id ?? ""}
          onChange={(e) => pick(e.target.value)}
        >
          <option value="" disabled>
            저장된 거래처에서 고르기
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.contactName ? ` (${c.contactName})` : ""}
            </option>
          ))}
        </select>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="상호 또는 이름">
          <input
            className={input}
            value={client.name}
            onChange={(e) => edit({ name: e.target.value })}
            placeholder="예: 가나다 주식회사"
          />
        </Field>
        <Field label="담당자">
          <input
            className={input}
            value={client.contactName}
            onChange={(e) => edit({ contactName: e.target.value })}
            placeholder="예: 홍길동"
          />
        </Field>
        <Field label="연락처">
          {/* 숫자만 입력해도 하이픈을 넣어 준다. 이 형식 그대로 저장된다 */}
          <input
            className={input}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={client.phone}
            onChange={(e) => edit({ phone: formatPhone(e.target.value) })}
            placeholder="예: 010-1234-5678"
          />
        </Field>
        <Field label="이메일">
          <input
            className={input}
            type="email"
            autoComplete="email"
            value={client.email}
            onChange={(e) => edit({ email: e.target.value })}
            placeholder="예: contact@company.com"
          />
        </Field>
        <Field label="사업자등록번호">
          <input
            className={input}
            inputMode="numeric"
            value={client.businessNo}
            onChange={(e) =>
              edit({ businessNo: formatBusinessNo(e.target.value) })
            }
            placeholder="예: 123-45-67890"
          />
        </Field>
        <Field label="주소">
          <input
            className={input}
            value={client.address}
            onChange={(e) => edit({ address: e.target.value })}
            placeholder="예: 서울시 강남구 ○○로 34"
          />
        </Field>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-500">
          {picked
            ? "저장된 거래처를 쓰고 있습니다. 칸을 고치면 직접 입력으로 바뀝니다."
            : client.name.trim()
              ? "직접 입력한 거래처입니다."
              : ""}
          {message && <span className="ml-1 text-pen">{message}</span>}
        </span>
        {!guest && !picked && client.name.trim() !== "" && (
          <button
            type="button"
            disabled={saving}
            onClick={saveToList}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {saving ? "저장 중…" : "거래처 목록에 저장"}
          </button>
        )}
      </div>
    </Section>
  );
}
