"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { inputClass } from "@/components/form";
import { api } from "@/lib/api/client";
import { errorMessages, loadError } from "@/lib/api/errors";
import { formatWon } from "@/lib/calc";
import type { SavedItem } from "@/lib/item";
import { presetOf } from "@/lib/preset";
import { industries } from "@/lib/preset/industries";

// 자주 쓰는 품목 관리. 업종별로 보고 지운다.
// 저장·수정은 견적서 작성 화면에서 한다 (품목을 적고 "자주 쓰는 품목에 저장", 같은 이름이면 덮어쓰기).

type ListState =
  | { kind: "loading" }
  | { kind: "loaded"; items: SavedItem[] }
  | { kind: "error"; message: string; needLogin?: boolean };

const TABS = industries.filter((industry) => industry.ready);

export default function ItemSettings() {
  const [preset, setPreset] = useState(TABS[0]?.code ?? "freelancer");
  const [list, setList] = useState<ListState>({ kind: "loading" });
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string[] | null>(null);

  useEffect(() => {
    api.items.list(preset).then(
      (items) => setList({ kind: "loaded", items }),
      (e) => setList(loadError(e, "자주 쓰는 품목")),
    );
  }, [preset]);

  function choose(code: string) {
    setPreset(code);
    setQuery("");
    setError(null);
    setList({ kind: "loading" });
  }

  async function remove(item: SavedItem) {
    if (
      !window.confirm(
        `"${item.name}"을(를) 지울까요? 이미 만든 견적서는 그대로 남습니다.`,
      )
    )
      return;
    setError(null);
    try {
      await api.items.remove(item.id);
      setList((prev) =>
        prev.kind === "loaded"
          ? {
              kind: "loaded",
              items: prev.items.filter((i) => i.id !== item.id),
            }
          : prev,
      );
    } catch (e) {
      setError(errorMessages(e));
    }
  }

  const q = query.trim().toLowerCase();
  const shown =
    list.kind === "loaded"
      ? list.items.filter((item) => !q || item.name.toLowerCase().includes(q))
      : [];
  const presetConfig = presetOf(preset);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-bold text-ink">자주 쓰는 품목</h1>
      <p className="mt-0.5 text-sm text-slate-500">
        견적서 작성 화면에서 품목을 적고 &ldquo;자주 쓰는 품목에 저장&rdquo;을
        누르면 여기에 모입니다. 가격을 바꾸려면 작성 화면에서 같은 이름으로 다시
        저장하세요.
      </p>

      <div
        role="tablist"
        aria-label="업종"
        className="mt-6 flex flex-wrap gap-1 border-b border-rule"
      >
        {TABS.map((industry) => (
          <button
            key={industry.code}
            type="button"
            role="tab"
            aria-selected={preset === industry.code}
            onClick={() => choose(industry.code)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              preset === industry.code
                ? "border-pen font-medium text-ink"
                : "border-transparent text-slate-500 hover:text-ink"
            }`}
          >
            {industry.name}
          </button>
        ))}
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

      {list.kind === "loaded" && list.items.length > 0 && (
        <input
          className={`${inputClass} mt-4`}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="품목 이름으로 찾기"
          aria-label="품목 이름으로 찾기"
        />
      )}

      {list.kind === "loading" && (
        <p className="mt-10 text-center text-sm text-slate-500">불러오는 중…</p>
      )}
      {list.kind === "error" && (
        <div className="mt-10 text-center text-sm text-slate-600">
          <p>{list.message}</p>
          {list.needLogin && (
            <Link
              href="/login?next=/settings/items"
              className="mt-3 inline-block text-pen underline"
            >
              로그인하러 가기
            </Link>
          )}
        </div>
      )}

      {list.kind === "loaded" && list.items.length === 0 && (
        <div className="mt-10 text-center text-sm text-slate-500">
          <p>이 업종에 저장한 품목이 아직 없습니다.</p>
          <Link
            href={`/documents/new?preset=${preset}`}
            className="mt-3 inline-block text-pen underline"
          >
            견적서를 쓰면서 저장하기
          </Link>
        </div>
      )}
      {list.kind === "loaded" &&
        list.items.length > 0 &&
        shown.length === 0 && (
          <p className="mt-10 text-center text-sm text-slate-500">
            &ldquo;{query.trim()}&rdquo;이(가) 들어간 품목이 없습니다.
          </p>
        )}

      {shown.length > 0 && (
        <ul className="mt-4 divide-y divide-rule rounded-xl border border-rule bg-paper">
          {shown.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-ink">{item.name}</p>
                {details(item, presetConfig) && (
                  <p className="mt-0.5 text-sm text-slate-500">
                    {details(item, presetConfig)}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm tabular-nums text-slate-700">
                  {formatWon(item.unitPrice)}
                  {item.unit && (
                    <span className="text-slate-400"> / {item.unit}</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => remove(item)}
                  className="text-sm text-slate-500 hover:text-red-700"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 목록에 보여 줄 한 줄: 규격 · 사양(인쇄) · 자재/노무 단가(시공) */
function details(item: SavedItem, preset: ReturnType<typeof presetOf>): string {
  const parts: string[] = [];
  if (item.description) parts.push(item.description);
  for (const column of preset?.columns ?? []) {
    const value = item.extra[column.key];
    if (value === undefined || value === null || value === "") continue;
    if (column.display === "detail") parts.push(String(value));
    if (column.partOf === "unitPrice" && typeof value === "number") {
      parts.push(`${column.label} ${formatWon(value)}`);
    }
  }
  return parts.join(" · ");
}
