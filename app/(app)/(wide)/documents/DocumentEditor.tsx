"use client";

import { documentPath } from "@/lib/paths";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import DocumentPreview from "@/components/document/DocumentPreview";
import { Field, Section, inputClass as input } from "@/components/form";
import { ApiError, api } from "@/lib/api/client";
import { errorMessages } from "@/lib/api/errors";
import { TAX_MODE_LABELS, formatWon, type TaxMode } from "@/lib/calc";
import {
  emptyForm,
  detailColumnsOf,
  emptyLine,
  formTotals,
  lineUnitPrice,
  optionsColumnOf,
  percentInput,
  pricePartsOf,
  sortByGroups,
  todayString,
  toRequest,
  unitOptionsOf,
  withCommas,
  type DocumentForm,
  type LineForm,
  type QuantityOptionForm,
} from "@/lib/document/form";
import { clearDraft, saveDraft, type DraftOrigin } from "@/lib/document/draft";
import {
  DOC_DATE_LABELS,
  DOC_TYPE_LABELS,
  type DocType,
  type DocumentStatus,
  type RelatedDocument,
  type ShareInfo,
} from "@/lib/document/types";
import type { PastedRow } from "@/lib/document/paste";
import { formatTime } from "@/lib/format";
import {
  itemRequestFromLine,
  linePatchFromItem,
  type SavedItem,
} from "@/lib/item";
import {
  partyView,
  type Client,
  type PartyFields,
  type Profile,
} from "@/lib/party/types";
import type { Preset, PresetColumn } from "@/lib/preset/types";
import { ClientSection, SupplierSection } from "./PartyFields";
import PastePanel from "./PastePanel";
import SharePanel from "./SharePanel";
import StatusSelect from "./StatusSelect";

// 견적서 작성·수정 화면 (TECH_SPEC 10.1).
// PC 는 왼쪽 입력·오른쪽 미리보기, 모바일은 탭으로 전환한다.
// 입력 순서: 내 정보 → 거래처 → 건명·날짜 → 품목 → 조건 → 세금 방식과 합계 → 비고.

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: string }
  | { kind: "error"; messages: string[]; needLogin?: boolean };

export default function DocumentEditor({
  preset,
  initial,
  documentId,
  docNo,
  status,
  savedAt,
  initialShare = null,
  docType = "ESTIMATE",
  source = null,
  derived = [],
  keptSupplier,
  restoredFrom,
  printedTotal = null,
}: {
  preset: Preset;
  initial: DocumentForm;
  /** 새 문서: 임시 보관본을 불러왔으면 그 출처 (쓰던 내용, 엑셀 파일). 안내 문구가 다르다 */
  restoredFrom?: DraftOrigin;
  /** AI 로 읽은 경우 원본에 적혀 있던 합계 (다시 계산한 합계와 다르면 알려 준다) */
  printedTotal?: number | null;
  /** 저장된 문서의 공급자 스냅샷. 그 내 정보가 지워져 고를 수 없을 때 "유지"로 보여 준다 */
  keptSupplier?: PartyFields | null;
  /** 저장된 문서를 고칠 때만. 없으면 새 문서 */
  documentId?: number;
  docNo?: string;
  /** 저장된 문서의 상태. 있으면 상태 선택을 보여 준다 */
  status?: DocumentStatus;
  /** 새 문서를 방금 저장하고 넘어왔을 때 그 시각. 저장 안내를 띄운 채로 시작한다 */
  savedAt?: string;
  /** 저장된 문서의 공유 링크 상태 */
  initialShare?: ShareInfo | null;
  /** 문서 종류. 제목·날짜 칸 이름이 달라진다. 새 문서는 늘 견적서 */
  docType?: DocType;
  /** 변환으로 만든 문서의 원본 */
  source?: RelatedDocument | null;
  /** 이 문서로 만든 거래명세서·청구서 */
  derived?: RelatedDocument[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  // 마지막으로 서버에 저장된 입력값. 지금 입력값과 다르면 저장하지 않은 수정이 있는 것이다
  const [savedForm, setSavedForm] = useState(initial);
  const dirty = JSON.stringify(form) !== JSON.stringify(savedForm);
  const [nextLineId, setNextLineId] = useState(
    Math.max(0, ...initial.lines.map((l) => l.id)) + 1,
  );
  const [nextGroupId, setNextGroupId] = useState(
    Math.max(0, ...initial.groups.map((g) => g.id)) + 1,
  );
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  // 공유 링크 (저장된 문서만). 막대의 "공유 링크" 버튼으로 칸을 연다
  const [share, setShare] = useState<ShareInfo | null>(initialShare);
  const [shareOpen, setShareOpen] = useState(false);
  /** 문서 변환 메뉴 */
  const [convertOpen, setConvertOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  /** 엑셀에서 붙여넣기 칸을 연 곳 (묶음을 쓰면 그 묶음, 아니면 groupId null) */
  const [pasteTarget, setPasteTarget] = useState<{
    groupId: number | null;
  } | null>(null);

  // 자주 쓰는 품목 (이 업종 것). 불러오지 못했으면(로그인 전 등) null 이고 버튼을 숨긴다
  const [savedItems, setSavedItems] = useState<SavedItem[] | null>(null);
  /** 불러오기 목록을 연 행 */
  const [pickerLine, setPickerLine] = useState<number | null>(null);
  /** 행 아래에 잠깐 보여 주는 안내 (저장했음, 오류 등) */
  const [itemNotice, setItemNotice] = useState<{
    lineId: number;
    text: string;
  } | null>(null);
  const [save, setSave] = useState<SaveState>(
    savedAt ? { kind: "saved", at: savedAt } : { kind: "idle" },
  );
  const [showRestored, setShowRestored] = useState(restoredFrom !== undefined);
  const isNew = documentId === undefined;

  /** 빈 새 문서로 되돌린다 (저장하고 넘어갔을 때, "새로 쓰기") */
  const startFresh = () => {
    const fresh = emptyForm(preset, todayString());
    setForm(fresh);
    setSavedForm(fresh);
    setNextLineId(Math.max(0, ...fresh.lines.map((l) => l.id)) + 1);
    setNextGroupId(Math.max(0, ...fresh.groups.map((g) => g.id)) + 1);
    setShowRestored(false);
  };

  // 새 문서는 쓰는 대로 브라우저에 임시 보관한다 (로그인하러 갔다 와도 이어 쓰도록, TECH_SPEC 10.2)
  useEffect(() => {
    if (isNew) saveDraft(preset.code, form);
  }, [isNew, preset.code, form]);

  // Next 16(cacheComponents)은 다른 화면으로 가면 이 화면을 없애지 않고 숨겨 두었다가 돌아오면 그대로 보여 준다.
  // 숨겨질 때: 사용자가 띄운 저장 안내는 지우고, 새 문서를 저장해 넘어간 경우에는 입력값도 처음으로 되돌린다.
  // 저장하지 않고 다른 화면에 다녀온 경우에는 쓰던 내용을 그대로 둔다.
  // ref 로 표시해 두는 이유: 개발 모드(StrictMode)는 처음 그릴 때도 정리 함수를 한 번 실행하므로,
  // 표시 없이 지우면 처음 열 때 받은 저장 안내(savedAt)까지 사라진다.
  const clearStatusOnHide = useRef(false);
  const resetOnHide = useRef(false);
  useLayoutEffect(() => {
    return () => {
      // 자주 쓰는 품목 안내·불러오기 목록은 화면을 떠나면 닫는다 (처음 열 때 지워져도 비어 있어 괜찮다)
      setItemNotice(null);
      setPickerLine(null);
      setPasteTarget(null);
      setConvertOpen(false);
      if (clearStatusOnHide.current) {
        clearStatusOnHide.current = false;
        setSave({ kind: "idle" });
      }
      if (resetOnHide.current) {
        // initial 이 아니라 빈 문서로: initial 은 임시 보관본일 수 있다
        resetOnHide.current = false;
        startFresh();
        setTab("edit");
      }
    };
    // startFresh 는 preset 만 쓴다. 정리 함수를 화면이 숨겨질 때만 부르려고 의존값을 preset 으로 둔다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  // 내 정보·거래처 목록. 화면이 다시 보일 때마다 새로 불러온다 (설정 화면에서 추가하고 돌아온 경우).
  // 새 문서는 이때 기본 내 정보와 그 세금 방식을 고른다 (profileId 가 아직 undefined 일 때만)
  // 로그인하지 않았으면(401) guest: 내 정보 칸에 "로그인하면 고를 수 있다"고 안내한다
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [clients, setClients] = useState<Client[] | null>(null);
  const [guest, setGuest] = useState(false);

  /** 이 행을 자주 쓰는 품목으로 저장. 같은 이름이 있으면 물어보고 덮어쓴다 */
  async function saveItem(line: LineForm) {
    const name = line.name.trim();
    if (name === "") {
      setItemNotice({
        lineId: line.id,
        text: "품목 이름을 먼저 입력해 주세요.",
      });
      return;
    }
    const existing = savedItems?.find((item) => item.name === name);
    if (
      existing &&
      !window.confirm(
        `자주 쓰는 품목에 '${name}'이(가) 이미 있습니다. 지금 내용으로 바꿀까요?`,
      )
    ) {
      return;
    }
    try {
      const body = itemRequestFromLine(line, preset);
      const saved = existing
        ? await api.items.update(existing.id, body)
        : await api.items.create(body);
      setSavedItems((prev) =>
        [...(prev ?? []).filter((item) => item.id !== saved.id), saved].sort(
          (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : a.id - b.id),
        ),
      );
      setItemNotice({
        lineId: line.id,
        text: existing
          ? "자주 쓰는 품목을 지금 내용으로 바꿨습니다."
          : "자주 쓰는 품목에 저장했습니다. 다른 견적서에서 불러올 수 있습니다.",
      });
    } catch (e) {
      setItemNotice({ lineId: line.id, text: errorMessages(e).join(" ") });
    }
  }
  useEffect(() => {
    api.profiles.list().then(
      (list) => {
        setGuest(false);
        setProfiles(list);
        setForm((prev) => withDefaultSupplier(prev, list, preset));
      },
      (e) => {
        setGuest(e instanceof ApiError && e.status === 401);
        setProfiles([]);
      },
    );
    api.clients.list().then(setClients, () => setClients([]));
    api.items.list(preset.code).then(setSavedItems, () => setSavedItems(null));
  }, [preset]);

  const totals = formTotals(form, preset);
  const unitOptions = unitOptionsOf(preset);
  // 단가를 나눠 받는 업종(시공의 자재·노무 단가)
  const priceParts = pricePartsOf(preset);
  // 품명 아래 한 줄로 보이는 사양 칸(인쇄의 용지·인쇄·후가공)과 수량별 가격
  const detailColumns = detailColumnsOf(preset);
  const optionsColumn = optionsColumnOf(preset);
  const surcharges = preset.surcharges ?? [];
  // 품목 칸의 이름·예시는 업종 설정에서 (예: 프리랜서 "작업 항목", 행사 "항목")
  const nameColumn = columnOf(preset, "name", "항목");
  const descriptionColumn = columnOf(preset, "description", "내용");
  const quantityColumn = columnOf(preset, "quantity", "수량");
  const unitPriceColumn = columnOf(preset, "unitPrice", "단가");

  // 미리보기의 공급자: 고른 내 정보, 없으면 문서에 남아 있는 공급자
  const selectedProfile = profiles?.find((p) => p.id === form.profileId);
  const supplier = selectedProfile
    ? partyView(selectedProfile)
    : form.profileId === null
      ? partyView(keptSupplier)
      : partyView(null);
  // 거래명세서의 공급자 표는 칸별 원래 값을 쓴다
  const supplierFields: PartyFields | null = selectedProfile
    ? selectedProfile
    : form.profileId === null
      ? (keptSupplier ?? null)
      : null;

  const change = (patch: Partial<DocumentForm>) =>
    setForm((prev) => ({ ...prev, ...patch }));
  const changeTerm = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, terms: { ...prev.terms, [key]: value } }));
  const changeLine = (id: number, patch: Partial<LineForm>) =>
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));

  /** 행 추가. 묶음을 쓰는 업종은 그 묶음의 맨 끝에 */
  const addLine = (groupId: number | null) => {
    setForm((prev) => ({
      ...prev,
      lines: sortByGroups(
        [...prev.lines, emptyLine(nextLineId, preset, groupId)],
        prev.groups,
      ),
    }));
    setNextLineId((n) => n + 1);
  };
  /**
   * 엑셀에서 붙여넣은 줄들을 품목으로 넣는다 (묶음을 쓰면 그 묶음 끝에).
   * 그 자리에 아직 아무것도 적지 않은 빈 줄 하나만 있으면 그 줄은 빼고 넣는다
   */
  const insertPasted = (rows: PastedRow[], groupId: number | null) => {
    const added: LineForm[] = rows.map((row, i) => {
      const line = emptyLine(nextLineId + i, preset, groupId);
      return {
        ...line,
        name: row.name,
        description: row.description,
        quantity: row.quantity,
        unit: row.unit || line.unit,
        unitPrice: row.unitPrice,
        extra: { ...line.extra, ...row.parts },
      };
    });
    setForm((prev) => {
      const siblings = prev.lines.filter((l) => l.groupId === groupId);
      const blank =
        siblings.length === 1 &&
        siblings[0].name.trim() === "" &&
        siblings[0].unitPrice === "" &&
        Object.values(siblings[0].extra).every((v) => v === "")
          ? siblings[0].id
          : null;
      return {
        ...prev,
        lines: sortByGroups(
          [...prev.lines.filter((l) => l.id !== blank), ...added],
          prev.groups,
        ),
      };
    });
    setNextLineId((n) => n + rows.length);
    setPasteTarget(null);
  };

  /** 행 삭제. 마지막 한 줄(묶음을 쓰면 그 묶음의 마지막 한 줄)은 지우지 않는다 */
  const removeLine = (id: number) =>
    setForm((prev) => {
      const line = prev.lines.find((l) => l.id === id);
      const siblings = prev.lines.filter((l) => l.groupId === line?.groupId);
      return siblings.length > 1
        ? { ...prev, lines: prev.lines.filter((l) => l.id !== id) }
        : prev;
    });
  /** 행을 위(-1)나 아래(+1)로 한 칸 옮긴다. 묶음 밖으로는 옮기지 않는다 */
  const moveLine = (index: number, step: -1 | 1) =>
    setForm((prev) => {
      const target = index + step;
      if (target < 0 || target >= prev.lines.length) return prev;
      if (prev.lines[target].groupId !== prev.lines[index].groupId) return prev;
      const lines = [...prev.lines];
      [lines[index], lines[target]] = [lines[target], lines[index]];
      return { ...prev, lines };
    });

  // 묶음(예: 시공의 공종). 새 묶음에는 빈 품목 한 줄을 같이 넣는다
  const groupLabel = preset.groupLabel ?? "묶음";
  const addGroup = () => {
    const group = { id: nextGroupId, name: "" };
    setForm((prev) => ({
      ...prev,
      groups: [...prev.groups, group],
      lines: [...prev.lines, emptyLine(nextLineId, preset, group.id)],
    }));
    setNextGroupId((n) => n + 1);
    setNextLineId((n) => n + 1);
  };
  const changeGroup = (id: number, name: string) =>
    setForm((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === id ? { ...g, name } : g)),
    }));
  const removeGroup = (id: number) => {
    const group = form.groups.find((g) => g.id === id);
    const filled = form.lines.some(
      (l) => l.groupId === id && (l.name.trim() !== "" || l.unitPrice !== ""),
    );
    if (
      filled &&
      !window.confirm(
        `'${group?.name || groupLabel}'와 그 안의 품목을 모두 지울까요?`,
      )
    ) {
      return;
    }
    setForm((prev) =>
      prev.groups.length > 1
        ? {
            ...prev,
            groups: prev.groups.filter((g) => g.id !== id),
            lines: prev.lines.filter((l) => l.groupId !== id),
          }
        : prev,
    );
  };
  const moveGroup = (index: number, step: -1 | 1) =>
    setForm((prev) => {
      const target = index + step;
      if (target < 0 || target >= prev.groups.length) return prev;
      const groups = [...prev.groups];
      [groups[index], groups[target]] = [groups[target], groups[index]];
      return { ...prev, groups, lines: sortByGroups(prev.lines, groups) };
    });

  /**
   * 품목 한 줄의 입력 카드.
   * @param i      form.lines 에서의 위치 (금액·이동에 쓴다)
   * @param n      화면에 보이는 순번 (묶음을 쓰면 묶음 안에서의 순번)
   */
  function renderLine(
    line: LineForm,
    i: number,
    n: number,
    first: boolean,
    last: boolean,
    only: boolean,
  ) {
    return (
      <li key={line.id} className="rounded-lg border border-rule bg-paper p-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{n + 1}번째 품목</span>
            {/* 자주 쓰는 품목: 로그인했을 때만 */}
            {savedItems !== null && !guest && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setPickerLine(pickerLine === line.id ? null : line.id)
                  }
                  className="font-medium text-pen hover:text-pen-deep"
                  aria-expanded={pickerLine === line.id}
                >
                  불러오기
                </button>
                <button
                  type="button"
                  onClick={() => saveItem(line)}
                  className="font-medium text-pen hover:text-pen-deep"
                >
                  자주 쓰는 품목에 저장
                </button>
              </>
            )}
          </span>
          <span className="flex gap-1">
            <IconButton
              label="위로"
              disabled={first}
              onClick={() => moveLine(i, -1)}
            >
              ↑
            </IconButton>
            <IconButton
              label="아래로"
              disabled={last}
              onClick={() => moveLine(i, 1)}
            >
              ↓
            </IconButton>
            <IconButton
              label="삭제"
              disabled={only}
              onClick={() => removeLine(line.id)}
            >
              ×
            </IconButton>
          </span>
        </div>
        {itemNotice?.lineId === line.id && (
          <p role="status" className="mt-1 text-xs text-pen-deep">
            {itemNotice.text}
          </p>
        )}
        {pickerLine === line.id && savedItems && (
          <ItemPicker
            items={savedItems}
            onPick={(item) => {
              changeLine(line.id, linePatchFromItem(item, preset));
              setPickerLine(null);
              setItemNotice(null);
            }}
            onClose={() => setPickerLine(null)}
          />
        )}
        <div className="mt-2 space-y-2">
          <input
            className={input}
            aria-label={nameColumn.label}
            value={line.name}
            onChange={(e) => changeLine(line.id, { name: e.target.value })}
            placeholder={placeholderOf(nameColumn)}
          />
          <input
            className={input}
            aria-label={descriptionColumn.label}
            value={line.description}
            onChange={(e) =>
              changeLine(line.id, { description: e.target.value })
            }
            placeholder={placeholderOf(descriptionColumn)}
          />
          {detailColumns.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-3">
              {detailColumns.map((column) => {
                const value = line.extra[column.key] ?? "";
                const set = (next: string) =>
                  changeLine(line.id, {
                    extra: { ...line.extra, [column.key]: next },
                  });
                return (
                  <label key={column.key} className="block">
                    <span className="mb-1 block text-xs text-slate-500">
                      {column.label}
                    </span>
                    {column.type === "select" ? (
                      <SelectWithCustom
                        label={column.label}
                        options={column.options ?? []}
                        value={value}
                        onChange={set}
                        emptyLabel="선택 안 함"
                        placeholder={`${column.label} 직접 입력`}
                        maxLength={200}
                      />
                    ) : (
                      <input
                        className={input}
                        value={value}
                        maxLength={200}
                        onChange={(e) => set(e.target.value)}
                        placeholder={column.placeholder}
                      />
                    )}
                  </label>
                );
              })}
            </div>
          )}
          {priceParts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 items-start gap-2">
                <input
                  className={`${input} text-right`}
                  aria-label={quantityColumn.label}
                  inputMode="decimal"
                  value={line.quantity}
                  onChange={(e) =>
                    changeLine(line.id, { quantity: e.target.value })
                  }
                  placeholder={quantityColumn.label}
                />
                <SelectWithCustom
                  label="단위"
                  options={unitOptions}
                  value={line.unit}
                  onChange={(unit) => changeLine(line.id, { unit })}
                  placeholder="예: 식"
                  maxLength={20}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {priceParts.map((part) => (
                  <label key={part.key} className="block">
                    <span className="mb-1 block text-xs text-slate-500">
                      {part.label}
                    </span>
                    <input
                      className={`${input} text-right`}
                      inputMode="numeric"
                      value={line.extra[part.key] ?? ""}
                      onChange={(e) =>
                        changeLine(line.id, {
                          extra: {
                            ...line.extra,
                            [part.key]: withCommas(e.target.value),
                          },
                        })
                      }
                      placeholder="0"
                    />
                  </label>
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-[1fr_1fr_2fr] items-start gap-2">
              <input
                className={`${input} text-right`}
                aria-label={quantityColumn.label}
                inputMode="decimal"
                value={line.quantity}
                onChange={(e) =>
                  changeLine(line.id, { quantity: e.target.value })
                }
              />
              <SelectWithCustom
                label="단위"
                options={unitOptions}
                value={line.unit}
                onChange={(unit) => changeLine(line.id, { unit })}
                placeholder="예: 컷"
                maxLength={20}
              />
              <input
                className={`${input} text-right`}
                aria-label={unitPriceColumn.label}
                inputMode="numeric"
                value={line.unitPrice}
                onChange={(e) =>
                  changeLine(line.id, {
                    unitPrice: withCommas(e.target.value),
                  })
                }
                placeholder={unitPriceColumn.label}
              />
            </div>
          )}
          <p className="text-right text-sm tabular-nums text-slate-700">
            {priceParts.length > 0 && (
              <span className="mr-2 text-xs text-slate-500">
                단가 {formatWon(lineUnitPrice(line, preset))}
              </span>
            )}
            금액 {formatWon(totals.lineAmounts[i])}
          </p>
          {optionsColumn && (
            <QuantityOptions
              label={optionsColumn.label}
              unit={line.unit}
              options={line.options ?? []}
              onChange={(options) => changeLine(line.id, { options })}
            />
          )}
        </div>
      </li>
    );
  }

  /**
   * 내려받기(PDF·엑셀) 전에 확인한다. 파일은 서버에 저장된 내용으로 만들어지므로 저장하지 않은 수정이 있으면 막는다
   */
  function guardDownload(e: React.MouseEvent<HTMLAnchorElement>, what: string) {
    if (!dirty) return;
    const message = `저장하지 않은 수정 내용이 있습니다. 저장한 뒤 ${what}${what === "엑셀" ? "을" : "를"} 내려받아 주세요.`;
    e.preventDefault();
    clearStatusOnHide.current = true;
    setSave({ kind: "error", messages: [message] });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** 문서 변환: 저장된 내용으로 새 문서를 만들고 그 문서로 넘어간다 */
  async function convertTo(target: DocType) {
    setConvertOpen(false);
    if (documentId === undefined) return;
    if (dirty) {
      clearStatusOnHide.current = true;
      setSave({
        kind: "error",
        messages: [
          "저장하지 않은 수정 내용이 있습니다. 저장한 뒤 문서를 변환해 주세요.",
        ],
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setConverting(true);
    try {
      const created = await api.documents.convert(documentId, target);
      router.push(documentPath(created.id, true));
    } catch (e) {
      clearStatusOnHide.current = true;
      setSave(saveError(e));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setConverting(false);
    }
  }

  async function handleSave() {
    clearStatusOnHide.current = true;
    setSave({ kind: "saving" });
    const body = toRequest(form, preset);
    try {
      if (documentId === undefined) {
        const created = await api.documents.create({
          ...body,
          presetCode: preset.code,
        });
        // 수정 화면으로 넘어가서 저장 안내를 띄운다 (EditDocument 가 ?saved 를 읽는다)
        clearDraft();
        resetOnHide.current = true;
        router.replace(documentPath(created.id, true));
        return;
      }
      const updated = await api.documents.update(documentId, body);
      setSavedForm(form);
      setSave({ kind: "saved", at: formatTime(updated.updatedAt) });
    } catch (e) {
      // 로그인·약관 동의가 필요하면 그 화면으로 보낸다. 새 문서는 임시 보관돼 있어 돌아오면 이어 쓸 수 있다
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        const next = encodeURIComponent(window.location.pathname);
        if (e.status === 401) {
          setSave({ kind: "idle" });
          router.push(`/login?next=${next}`);
          return;
        }
        if (e.body.code === "AGREEMENT_REQUIRED") {
          setSave({ kind: "idle" });
          router.push(`/welcome?next=${next}`);
          return;
        }
      }
      setSave(saveError(e));
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-ink">
        {documentId === undefined
          ? `새 ${DOC_TYPE_LABELS[docType]}`
          : `${DOC_TYPE_LABELS[docType]} 수정`}
      </h1>
      <p className="mt-0.5 text-sm text-slate-500">
        {preset.name}
        {docNo && <span className="ml-2 tabular-nums">{docNo}</span>}
      </p>
      {/* 변환으로 이어진 문서: 원본, 이 문서로 만든 문서 */}
      {(source || derived.length > 0) && (
        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-600">
          {source && (
            <span>
              원본{" "}
              <Link
                href={documentPath(source.id)}
                className="text-pen underline-offset-2 hover:underline"
              >
                {DOC_TYPE_LABELS[source.docType]}{" "}
                <span className="tabular-nums">{source.docNo}</span>
              </Link>
            </span>
          )}
          {derived.length > 0 && (
            <span>
              이 문서로 만든 문서{" "}
              {derived.map((d, i) => (
                <span key={d.id}>
                  {i > 0 && " · "}
                  <Link
                    href={documentPath(d.id)}
                    className="text-pen underline-offset-2 hover:underline"
                  >
                    {DOC_TYPE_LABELS[d.docType]}{" "}
                    <span className="tabular-nums">{d.docNo}</span>
                  </Link>
                </span>
              ))}
            </span>
          )}
        </p>
      )}

      {/* 왼쪽 상태 선택(저장된 문서만), 오른쪽 저장 버튼 */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          {documentId !== undefined && status && (
            <StatusSelect documentId={documentId} initialStatus={status} />
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={save.kind === "saving"}
            className="rounded-md bg-pen px-4 py-2 text-sm font-medium text-white hover:bg-pen-deep disabled:opacity-60"
          >
            {save.kind === "saving" ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>

      {showRestored && save.kind === "idle" && (
        <div
          role="status"
          className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-md bg-pen-soft px-4 py-3 text-sm text-pen-deep"
        >
          <span>
            {restoredFrom === "ai" ? (
              <>
                올린 파일을 AI 로 읽어 왔습니다.{" "}
                <strong>
                  잘못 읽은 곳이 있을 수 있으니 거래처·수량·단가를 꼭 확인하고
                </strong>{" "}
                저장을 눌러 주세요.
                {printedTotal != null &&
                  printedTotal !== totals.totalAmount && (
                    <span className="mt-1 block text-red-700">
                      파일에 적힌 합계 {formatWon(printedTotal)}와 다시 계산한
                      합계 {formatWon(totals.totalAmount)}가 다릅니다. 품목과
                      세금 방식을 확인해 주세요.
                    </span>
                  )}
              </>
            ) : restoredFrom === "excel" ? (
              "엑셀 파일을 불러왔습니다. 거래처·금액을 확인하고 저장을 눌러 주세요."
            ) : (
              "작성하던 견적서를 불러왔습니다. 확인하고 저장을 눌러 주세요."
            )}
          </span>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("작성하던 내용을 지우고 새로 쓸까요?")) {
                clearDraft();
                startFresh();
              }
            }}
            className="font-medium underline"
          >
            새로 쓰기
          </button>
        </div>
      )}

      {save.kind === "saved" && (
        <div
          role="status"
          className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          <span>
            {save.at}에 저장했습니다.
            {docNo && (
              <span className="ml-1 tabular-nums">문서 번호 {docNo}</span>
            )}
          </span>
          <Link href="/documents" className="font-medium underline">
            내 문서에서 보기
          </Link>
        </div>
      )}

      {save.kind === "error" && (
        <div
          role="alert"
          className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <ul className="list-disc space-y-0.5 pl-4">
            {save.messages.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          {save.needLogin && (
            <Link
              href="/login"
              className="mt-2 inline-block font-medium underline"
            >
              로그인하러 가기
            </Link>
          )}
        </div>
      )}

      {/* 모바일에서만 보이는 탭 */}
      <div className="mt-4 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm lg:hidden">
        {(["edit", "preview"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-md py-1.5 ${tab === t ? "bg-paper font-medium text-ink shadow-sm" : "text-slate-500"}`}
          >
            {t === "edit" ? "입력" : "미리보기"}
          </button>
        ))}
      </div>

      {/* 입력 5 : 미리보기 6. 미리보기를 조금 넓게 해서 실제 문서(A4)와 비슷하게 보이게 한다 */}
      <div className="mt-4 grid gap-6 lg:grid-cols-[5fr_6fr]">
        <div className={`space-y-5 ${tab === "edit" ? "" : "hidden"} lg:block`}>
          <SupplierSection
            profiles={profiles}
            profileId={form.profileId}
            keptSupplier={keptSupplier ? partyView(keptSupplier) : null}
            guest={guest}
            onChange={(profileId) => change({ profileId })}
          />

          <ClientSection
            clients={clients}
            client={form.client}
            guest={guest}
            onChange={(client) => change({ client })}
            onClientSaved={(saved) =>
              setClients((prev) =>
                [...(prev ?? []), saved].sort((a, b) =>
                  a.name < b.name ? -1 : a.name > b.name ? 1 : a.id - b.id,
                ),
              )
            }
          />

          <Section title="건명·날짜">
            <Field label="건명">
              <input
                className={input}
                value={form.title}
                onChange={(e) => change({ title: e.target.value })}
                placeholder={preset.titlePlaceholder}
              />
            </Field>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label={DOC_DATE_LABELS[docType].issue}>
                <input
                  className={input}
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => change({ issueDate: e.target.value })}
                />
              </Field>
              {/* 두 번째 날짜: 견적서 유효기간, 청구서 입금 기한. 거래명세서에는 없다 */}
              {DOC_DATE_LABELS[docType].until && (
                <Field label={`${DOC_DATE_LABELS[docType].until} (선택)`}>
                  <input
                    className={input}
                    type="date"
                    value={form.validUntil}
                    min={form.issueDate}
                    onChange={(e) => change({ validUntil: e.target.value })}
                  />
                </Field>
              )}
            </div>
          </Section>

          <Section title="품목">
            {preset.useGroups ? (
              <div className="space-y-4">
                {form.groups.map((group, g) => {
                  const indexes = form.lines
                    .map((line, i) => (line.groupId === group.id ? i : -1))
                    .filter((i) => i >= 0);
                  const subtotal = indexes.reduce(
                    (sum, i) => sum + totals.lineAmounts[i],
                    0,
                  );
                  return (
                    <div
                      key={group.id}
                      className="rounded-lg border border-rule bg-slate-50/60 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          className={`${input} font-semibold`}
                          aria-label={`${g + 1}번째 ${groupLabel} 이름`}
                          list="group-options"
                          value={group.name}
                          maxLength={100}
                          onChange={(e) =>
                            changeGroup(group.id, e.target.value)
                          }
                          placeholder={`${groupLabel} 이름 (예: ${preset.groupOptions?.[3] ?? "목공"})`}
                        />
                        <span className="flex shrink-0 gap-1">
                          <IconButton
                            label={`${groupLabel} 위로`}
                            disabled={g === 0}
                            onClick={() => moveGroup(g, -1)}
                          >
                            ↑
                          </IconButton>
                          <IconButton
                            label={`${groupLabel} 아래로`}
                            disabled={g === form.groups.length - 1}
                            onClick={() => moveGroup(g, 1)}
                          >
                            ↓
                          </IconButton>
                          <IconButton
                            label={`${groupLabel} 삭제`}
                            disabled={form.groups.length === 1}
                            onClick={() => removeGroup(group.id)}
                          >
                            ×
                          </IconButton>
                        </span>
                      </div>
                      <ol className="mt-3 space-y-3">
                        {indexes.map((i, n) =>
                          renderLine(
                            form.lines[i],
                            i,
                            n,
                            n === 0,
                            n === indexes.length - 1,
                            indexes.length === 1,
                          ),
                        )}
                      </ol>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => addLine(group.id)}
                            className="rounded-md border border-dashed border-slate-300 bg-paper px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                          >
                            + 품목 추가
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPasteTarget(
                                pasteTarget?.groupId === group.id
                                  ? null
                                  : { groupId: group.id },
                              )
                            }
                            className="rounded-md px-2 py-1.5 text-sm text-pen hover:text-pen-deep"
                          >
                            엑셀에서 붙여넣기
                          </button>
                        </span>
                        <p className="text-sm font-medium tabular-nums text-slate-700">
                          {group.name.trim() || groupLabel} 소계{" "}
                          {formatWon(subtotal)}
                        </p>
                      </div>
                      {pasteTarget?.groupId === group.id && (
                        <PastePanel
                          preset={preset}
                          onInsert={(rows) => insertPasted(rows, group.id)}
                          onClose={() => setPasteTarget(null)}
                        />
                      )}
                    </div>
                  );
                })}
                <datalist id="group-options">
                  {(preset.groupOptions ?? []).map((o) => (
                    <option key={o} value={o} />
                  ))}
                </datalist>
                <button
                  type="button"
                  onClick={addGroup}
                  className="w-full rounded-md border border-dashed border-slate-300 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  + {groupLabel} 추가
                </button>
              </div>
            ) : (
              <>
                <ol className="space-y-3">
                  {form.lines.map((line, i) =>
                    renderLine(
                      line,
                      i,
                      i,
                      i === 0,
                      i === form.lines.length - 1,
                      form.lines.length === 1,
                    ),
                  )}
                </ol>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => addLine(null)}
                    className="flex-1 rounded-md border border-dashed border-slate-300 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    + 품목 추가
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPasteTarget(pasteTarget ? null : { groupId: null })
                    }
                    className="shrink-0 rounded-md px-3 py-2 text-sm text-pen hover:text-pen-deep"
                  >
                    엑셀에서 붙여넣기
                  </button>
                </div>
                {pasteTarget && pasteTarget.groupId === null && (
                  <PastePanel
                    preset={preset}
                    onInsert={(rows) => insertPasted(rows, null)}
                    onClose={() => setPasteTarget(null)}
                  />
                )}
              </>
            )}
          </Section>

          {preset.termFields.length > 0 && (
            <Section title="조건">
              <div className="grid gap-3 sm:grid-cols-2">
                {preset.termFields.map((field) => (
                  <Field key={field.key} label={field.label}>
                    {field.type === "select" ? (
                      <SelectWithCustom
                        label={field.label}
                        options={field.options ?? []}
                        value={form.terms[field.key] ?? ""}
                        onChange={(value) => changeTerm(field.key, value)}
                        emptyLabel="선택 안 함"
                        placeholder={`${field.label} 직접 입력`}
                        maxLength={100}
                      />
                    ) : (
                      <input
                        className={input}
                        type={field.type === "date" ? "date" : "text"}
                        inputMode={
                          field.type === "number" ? "numeric" : undefined
                        }
                        value={form.terms[field.key] ?? ""}
                        onChange={(e) => changeTerm(field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}
                  </Field>
                ))}
              </div>
            </Section>
          )}
          <Section title="세금 방식과 합계">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="세금 방식">
                <select
                  className={input}
                  value={form.taxMode}
                  onChange={(e) =>
                    change({ taxMode: e.target.value as TaxMode })
                  }
                >
                  {preset.taxModes.map((m) => (
                    <option key={m} value={m}>
                      {TAX_MODE_LABELS[m]}
                    </option>
                  ))}
                </select>
              </Field>
              {surcharges.map((s, k) => (
                <Field key={s.key} label={`${s.label} (%)`}>
                  <div className="flex items-center gap-2">
                    <input
                      className={`${input} text-right`}
                      inputMode="decimal"
                      value={form.surcharges[s.key] ?? ""}
                      onChange={(e) =>
                        change({
                          surcharges: {
                            ...form.surcharges,
                            [s.key]: percentInput(e.target.value),
                          },
                        })
                      }
                      placeholder="0"
                    />
                    <span className="w-28 shrink-0 text-right text-sm tabular-nums text-slate-500">
                      {formatWon(totals.surchargeAmounts[k] ?? 0)}
                    </span>
                  </div>
                </Field>
              ))}
              <Field label="할인 (원)">
                <input
                  className={`${input} text-right`}
                  inputMode="numeric"
                  value={form.discount}
                  onChange={(e) =>
                    change({ discount: withCommas(e.target.value) })
                  }
                  placeholder="0"
                />
              </Field>
            </div>
            <p className="mt-3 text-right text-base font-semibold tabular-nums text-ink">
              {form.taxMode === "WITHHOLDING_3_3" ? "청구 금액" : "합계"}{" "}
              {formatWon(totals.totalAmount)}
            </p>
            {form.taxMode === "WITHHOLDING_3_3" && (
              <p className="text-right text-sm tabular-nums text-slate-500">
                공제 {formatWon(totals.taxAmount)} · 실수령{" "}
                {formatWon(totals.netAmount)}
              </p>
            )}
          </Section>

          <Section title="비고">
            <textarea
              className={`${input} min-h-24`}
              value={form.notes}
              onChange={(e) => change({ notes: e.target.value })}
              placeholder="예: 계약금 입금 후 작업을 시작합니다."
            />
          </Section>
        </div>

        <div className={`${tab === "preview" ? "" : "hidden"} lg:block`}>
          <div className="lg:sticky lg:top-4">
            {/* 문서 작업 막대: PDF 내려받기. 엑셀 내려받기·문서 변환(2차)도 여기에 둔다.
                미리보기 위에 두어 스크롤하지 않아도 보이게 한다 */}
            <div className="mb-2 flex min-h-9 flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-ink">미리보기</h2>
              {documentId === undefined ? (
                <p className="text-sm text-slate-500">
                  저장하면 PDF로 내려받을 수 있습니다.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {/* PDF 는 서버에 저장된 내용으로 만들어지므로, 저장하지 않은 수정이 있으면 막는다 */}
                  <a
                    href={`/api/documents/${documentId}/pdf`}
                    onClick={(e) => guardDownload(e, "PDF")}
                    className="rounded-md border border-slate-300 bg-paper px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    PDF 내려받기
                  </a>
                  <a
                    href={`/api/documents/${documentId}/xlsx`}
                    onClick={(e) => guardDownload(e, "엑셀")}
                    className="rounded-md border border-slate-300 bg-paper px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    엑셀 내려받기
                  </a>
                  {/* 문서 변환: 원본은 두고 거래명세서·청구서를 새로 만든다 */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setConvertOpen((open) => !open)}
                      aria-expanded={convertOpen}
                      disabled={converting}
                      className="rounded-md border border-slate-300 bg-paper px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {converting ? "만드는 중…" : "문서 변환"}
                    </button>
                    {convertOpen && (
                      <div className="absolute right-0 z-10 mt-1 w-48 rounded-md border border-rule bg-paper py-1 shadow-md">
                        {CONVERT_TARGETS.filter((t) => t !== docType).map(
                          (target) => (
                            <button
                              key={target}
                              type="button"
                              onClick={() => convertTo(target)}
                              className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-pen-soft"
                            >
                              {DOC_TYPE_LABELS[target]}로 만들기
                            </button>
                          ),
                        )}
                        <p className="border-t border-rule px-3 py-2 text-xs text-slate-500">
                          지금 문서는 그대로 두고 같은 내용으로 새 문서를
                          만듭니다. 날짜는 오늘로 바뀝니다.
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShareOpen((open) => !open)}
                    aria-expanded={shareOpen}
                    className="rounded-md border border-slate-300 bg-paper px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    공유 링크
                    {share && (
                      <span className="ml-1.5 text-xs font-normal text-pen">
                        {share.firstViewedAt ? "열어 봄" : "켜짐"}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {documentId !== undefined && shareOpen && (
              <SharePanel
                documentId={documentId}
                share={share}
                onChange={setShare}
                dirty={dirty}
              />
            )}

            <DocumentPreview
              preset={preset}
              form={form}
              totals={totals}
              docNo={docNo}
              supplier={supplier}
              supplierFields={supplierFields}
              docType={docType}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** 업종 설정의 열. 설정에 없으면 이름만 있는 기본 열 */
function columnOf(
  preset: Preset,
  key: string,
  fallbackLabel: string,
): PresetColumn {
  return (
    preset.columns.find((c) => c.key === key) ?? {
      key,
      label: fallbackLabel,
      type: "text",
    }
  );
}

/** 입력 칸 예시: "작업 항목 (예: 메인 페이지 디자인)", 필수가 아니면 끝에 "(선택)" */
function placeholderOf(column: PresetColumn): string {
  const example = column.placeholder ? ` (${column.placeholder})` : "";
  return `${column.label}${example}${column.required ? "" : " (선택)"}`;
}

/**
 * 새 문서(profileId 가 아직 undefined)에 기본 내 정보를 고르고, 그 기본 세금 방식이 이 업종에서 쓸 수 있으면 따른다.
 * 이미 정해졌으면(고른 것이든 "선택 안 함"이든) 그대로 둔다.
 */
function withDefaultSupplier(
  form: DocumentForm,
  profiles: Profile[],
  preset: Preset,
): DocumentForm {
  if (form.profileId !== undefined) return form;
  const def = profiles.find((p) => p.isDefault);
  return {
    ...form,
    profileId: def?.id ?? null,
    taxMode:
      def && preset.taxModes.includes(def.taxType) ? def.taxType : form.taxMode,
  };
}

/** 저장 실패를 화면에 보여 줄 문장으로 바꾼다 */
function saveError(e: unknown): SaveState {
  if (e instanceof ApiError) {
    if (e.status === 401) {
      return {
        kind: "error",
        messages: ["로그인해야 저장할 수 있습니다."],
        needLogin: true,
      };
    }
    const fieldMessages = Object.values(e.body.fields ?? {});
    return {
      kind: "error",
      messages:
        fieldMessages.length > 0
          ? [...new Set(fieldMessages)]
          : [e.body.message],
    };
  }
  return {
    kind: "error",
    messages: ["저장하지 못했습니다. 잠시 후 다시 시도해 주세요."],
  };
}

/** 변환해 만들 수 있는 문서 종류 (견적서로는 바꾸지 않는다) */
const CONVERT_TARGETS: DocType[] = ["STATEMENT", "INVOICE"];

const CUSTOM = "__custom__";

/**
 * 업종 설정의 select 칸(단위, 결제 조건 등) — 목록 + "직접 입력".
 * 직접 입력을 고르면 아래에 입력란이 나오고, 거기 적은 값이 그대로 저장된다.
 * 목록에 없는 값으로 저장된 문서를 열면 직접 입력 상태로 시작한다.
 *
 * @param emptyLabel 있으면 빈 값을 고를 수 있다 (예: "선택 안 함")
 */
function SelectWithCustom({
  label: text,
  options,
  value,
  onChange,
  emptyLabel,
  placeholder,
  maxLength,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  emptyLabel?: string;
  placeholder: string;
  maxLength: number;
}) {
  // 빈 값은 "선택 안 함"과 "직접 입력 직후"가 같아 보이므로 직접 입력 중인지 따로 기억한다
  const [custom, setCustom] = useState(
    () =>
      !options.includes(value) && (value !== "" || emptyLabel === undefined),
  );
  // 사용자가 직접 입력을 고른 순간에만 입력란으로 커서를 옮긴다
  const [focusInput, setFocusInput] = useState(false);

  return (
    <div className="space-y-2">
      <select
        className={input}
        aria-label={text}
        value={custom ? CUSTOM : value}
        onChange={(e) => {
          const next = e.target.value;
          setCustom(next === CUSTOM);
          setFocusInput(next === CUSTOM);
          onChange(next === CUSTOM ? "" : next);
        }}
      >
        {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
        <option value={CUSTOM}>직접 입력</option>
      </select>
      {custom && (
        <input
          className={input}
          aria-label={`${text} 직접 입력`}
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={focusInput}
        />
      )}
    </div>
  );
}

/** 자주 쓰는 품목에서 고르기. 이름으로 거른다 (이 업종 것만, 최대 200개를 이미 불러와 둔다) */
function ItemPicker({
  items,
  onPick,
  onClose,
}: {
  items: SavedItem[];
  onPick: (item: SavedItem) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q
    ? items.filter((item) => item.name.toLowerCase().includes(q))
    : items;

  return (
    <div className="mt-2 rounded-md border border-rule bg-slate-50 p-2">
      <div className="flex items-center gap-2">
        <input
          className={input}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="품목 이름으로 찾기"
          aria-label="자주 쓰는 품목 찾기"
          autoFocus
        />
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-sm text-slate-500 hover:text-ink"
        >
          닫기
        </button>
      </div>
      {items.length === 0 ? (
        <p className="px-1 py-3 text-sm text-slate-500">
          아직 저장한 품목이 없습니다. 품목을 적고 &ldquo;자주 쓰는 품목에
          저장&rdquo;을 누르면 여기에 나옵니다.
        </p>
      ) : shown.length === 0 ? (
        <p className="px-1 py-3 text-sm text-slate-500">
          &ldquo;{query.trim()}&rdquo;이(가) 들어간 품목이 없습니다.
        </p>
      ) : (
        <ul className="mt-2 max-h-60 divide-y divide-rule overflow-y-auto rounded border border-rule bg-paper">
          {shown.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onPick(item)}
                className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-pen-soft"
              >
                <span className="min-w-0">
                  <span className="text-ink">{item.name}</span>
                  {item.description && (
                    <span className="ml-2 text-xs text-slate-500">
                      {item.description}
                    </span>
                  )}
                </span>
                <span className="shrink-0 tabular-nums text-slate-600">
                  {formatWon(item.unitPrice)}
                  {item.unit && (
                    <span className="text-slate-400"> / {item.unit}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 수량별 가격 (최대 5개). 견적서 품목 아래에 "500매 45,000원 · …" 으로 보이고, 합계에는 들어가지 않는다 */
function QuantityOptions({
  label: text,
  unit,
  options,
  onChange,
}: {
  label: string;
  unit: string;
  options: QuantityOptionForm[];
  onChange: (options: QuantityOptionForm[]) => void;
}) {
  const update = (index: number, patch: Partial<QuantityOptionForm>) =>
    onChange(options.map((o, k) => (k === index ? { ...o, ...patch } : o)));

  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">
          {text} (선택)
        </span>
        <button
          type="button"
          disabled={options.length >= 5}
          onClick={() => onChange([...options, { quantity: "", amount: "" }])}
          className="text-xs font-medium text-pen hover:text-pen-deep disabled:opacity-40"
        >
          + 수량 추가
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        다른 수량으로 하면 얼마인지 함께 적어 두면 거래처가 견적서를 보고 수량을
        고를 수 있습니다. 견적서에는 참고용으로 표시되고 합계에는 들어가지
        않습니다.
      </p>
      {options.length > 0 && (
        <ul className="mt-2 space-y-2">
          {options.map((option, k) => (
            <li
              key={k}
              className="grid grid-cols-[1fr_1.4fr_auto] items-center gap-2"
            >
              <div className="flex items-center gap-1">
                <input
                  className={`${input} text-right`}
                  aria-label={`${text} ${k + 1} 수량`}
                  inputMode="decimal"
                  value={option.quantity}
                  onChange={(e) => update(k, { quantity: e.target.value })}
                  placeholder="수량"
                />
                {unit && (
                  <span className="shrink-0 text-sm text-slate-500">
                    {unit}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <input
                  className={`${input} text-right`}
                  aria-label={`${text} ${k + 1} 금액`}
                  inputMode="numeric"
                  value={option.amount}
                  onChange={(e) =>
                    update(k, { amount: withCommas(e.target.value) })
                  }
                  placeholder="금액"
                />
                <span className="shrink-0 text-sm text-slate-500">원</span>
              </div>
              <IconButton
                label={`${text} ${k + 1} 삭제`}
                onClick={() => onChange(options.filter((_, j) => j !== k))}
              >
                ×
              </IconButton>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IconButton({
  label: text,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={text}
      title={text}
      disabled={disabled}
      onClick={onClick}
      className="h-6 w-6 rounded text-slate-500 hover:bg-slate-100 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
