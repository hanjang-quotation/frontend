/* eslint-disable @next/next/no-img-element -- 로고·도장은 로그인·공유 링크 주소의 이미지를 그대로 보여 준다 */

import { formatWon, type Totals } from "@/lib/calc";
import { formatDate, koreanAmountSentence } from "@/lib/format";
import { imageUrl } from "@/lib/image";
import { Fragment } from "react";
import {
  filledOptions,
  lineDetail,
  optionsColumnOf,
  parseNumber,
  pricePartsOf,
  type DocumentForm,
  type LineForm,
} from "@/lib/document/form";
import {
  DOC_DATE_LABELS,
  DOC_TYPE_LABELS,
  type DocType,
} from "@/lib/document/types";
import { partyView, type PartyFields, type PartyView } from "@/lib/party/types";
import type { Preset } from "@/lib/preset/types";

// 작성 화면 오른쪽의 실시간 미리보기. 입력값을 견적서 모양으로 그리기만 한다.
// 금액은 화면 계산값이며, 저장하면 서버가 같은 규칙으로 다시 계산한다.

export default function DocumentPreview({
  preset,
  form,
  totals,
  docNo,
  supplier,
  supplierFields = null,
  imageSrc = imageUrl,
  docType = "ESTIMATE",
}: {
  preset: Preset;
  form: DocumentForm;
  totals: Totals;
  docNo?: string;
  /** 공급자 칸. 고른 내 정보 또는 문서에 남아 있는 공급자 */
  supplier: PartyView;
  /** 공급자 스냅샷 원래 값 (거래명세서의 공급자 표에 칸별로 쓴다) */
  supplierFields?: PartyFields | null;
  /** 로고·도장 이미지 주소 (작성 화면: 본인 이미지, 공유 링크: 그 링크의 이미지) */
  imageSrc?: (id: number) => string;
  /** 문서 종류. 제목과 날짜 칸 이름이 달라진다 (거래명세서는 두 번째 날짜가 없다) */
  docType?: DocType;
}) {
  const { taxMode } = form;
  const heading = DOC_TYPE_LABELS[docType];
  const dateLabels = DOC_DATE_LABELS[docType];
  const logoId = supplierFields?.logoImageId ?? null;
  const stampId = supplierFields?.stampImageId ?? null;
  const receiver = partyView(form.client);
  const filledTerms = preset.termFields.filter(
    (field) => (form.terms[field.key] ?? "").trim() !== "",
  );
  // 단가 칸: 보통 단가 하나, 시공은 자재·노무 단가
  const priceParts = pricePartsOf(preset);
  const optionsColumn = optionsColumnOf(preset);
  const priceColumns =
    priceParts.length > 0
      ? priceParts.map((p) => ({ key: p.key, label: p.label }))
      : [{ key: "unitPrice", label: "단가" }];
  const columnCount = 4 + priceColumns.length;
  const isFilled = (line: LineForm) =>
    line.name.trim() !== "" ||
    line.unitPrice !== "" ||
    Object.values(line.extra).some((v) => v !== "");
  const filledLines = form.lines
    .map((line, i) => ({ line, amount: totals.lineAmounts[i] }))
    .filter(({ line }) => isFilled(line));
  const numberOf = new Map(filledLines.map(({ line }, i) => [line.id, i + 1]));
  // 묶음을 쓰면 묶음 순서대로 [묶음, 그 안의 품목]. 품목을 하나도 적지 않은 묶음은 뺀다
  const sections = preset.useGroups
    ? form.groups
        .map((group) => ({
          group,
          rows: filledLines.filter(({ line }) => line.groupId === group.id),
        }))
        .filter((s) => s.rows.length > 0)
    : [{ group: null, rows: filledLines }];
  const filledSurcharges = (preset.surcharges ?? [])
    .map((s, k) => ({
      ...s,
      rate: (form.surcharges[s.key] ?? "").trim(),
      amount: totals.surchargeAmounts[k] ?? 0,
    }))
    .filter((s) => Number(s.rate) > 0);

  return (
    <article className="rounded-xl border border-rule bg-paper p-6 text-[13px] leading-relaxed text-slate-800 shadow-sm sm:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-slate-800 pb-4">
        {/* 로고는 제목 왼쪽 같은 줄에 (PDF 와 같게) */}
        <div className="flex items-center gap-4">
          {logoId != null && (
            <img
              src={imageSrc(logoId)}
              alt="로고"
              className="max-h-10 max-w-[150px] object-contain"
            />
          )}
          <h2 className="text-2xl font-bold tracking-[0.3em] whitespace-nowrap text-ink">
            {heading}
          </h2>
        </div>
        <dl className="grid grid-cols-[auto_auto] gap-x-3 text-xs text-slate-600">
          {docNo && (
            <>
              <dt>문서 번호</dt>
              <dd className="text-right tabular-nums">{docNo}</dd>
            </>
          )}
          <dt>{dateLabels.issue}</dt>
          <dd className="text-right tabular-nums">
            {form.issueDate ? formatDate(form.issueDate) : "-"}
          </dd>
          {form.validUntil && dateLabels.until && (
            <>
              <dt>{dateLabels.until}</dt>
              <dd className="text-right tabular-nums">
                {formatDate(form.validUntil)}까지
              </dd>
            </>
          )}
        </dl>
      </header>

      {docType === "STATEMENT" ? (
        <>
          {/* 거래명세서: 공급받는자 | 공급자 표 (PDF statement-a4 와 같은 칸) */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <PartyGrid
              title="공급받는자"
              rows={[
                ["등록번호", form.client.businessNo],
                [
                  "상호",
                  form.client.name.trim() ? `${form.client.name} 귀하` : "",
                ],
                ["주소", form.client.address],
                ["담당자", form.client.contactName],
                ["연락처", form.client.phone],
                ["이메일", form.client.email],
              ]}
            />
            <PartyGrid
              title="공급자"
              rows={[
                ["등록번호", supplierFields?.businessNo],
                ["상호", supplierFields?.name],
                [
                  "성명",
                  <span key="rep" className="inline-flex items-center gap-1">
                    {supplierFields?.representative}
                    {stampId != null && (
                      <img
                        src={imageSrc(stampId)}
                        alt="도장"
                        className="h-8 w-8 object-contain"
                      />
                    )}
                  </span>,
                ],
                ["주소", supplierFields?.address],
                ["업태", supplierFields?.businessType],
                ["종목", supplierFields?.businessItem],
                [
                  "연락처",
                  [supplierFields?.phone, supplierFields?.email]
                    .filter(Boolean)
                    .join(" · "),
                ],
              ]}
            />
          </div>
          <AmountInWords
            label="합계 금액"
            total={totals.totalAmount}
            vat={taxMode === "VAT_10"}
          />
          <p className="mt-3 text-slate-600">
            건명{" "}
            <span className="font-semibold text-ink">
              {form.title.trim() || "-"}
            </span>
          </p>
        </>
      ) : (
        <>
          <section className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-500">받는 분</h3>
              <p className="mt-1 text-base font-semibold text-ink">
                {receiver.name ? `${receiver.name} 귀하` : "거래처 이름"}
              </p>
              {receiver.details && (
                <p className="text-slate-600">{receiver.details}</p>
              )}
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-500">공급자</h3>
              {supplier.name ? (
                <>
                  <p className="mt-1 flex items-center gap-2 text-base font-semibold text-ink">
                    {supplier.name}
                    {stampId != null && (
                      <img
                        src={imageSrc(stampId)}
                        alt="도장"
                        className="h-12 w-12 object-contain"
                      />
                    )}
                  </p>
                  {supplier.details && (
                    <p className="text-slate-600">{supplier.details}</p>
                  )}
                  {supplier.bank && (
                    <p className="text-slate-600">입금 계좌 {supplier.bank}</p>
                  )}
                </>
              ) : (
                <p className="mt-1 text-slate-400">
                  내 정보를 고르면 상호·연락처·입금 계좌가 들어갑니다.
                </p>
              )}
            </div>
          </section>

          {docType === "INVOICE" ? (
            <>
              {/* 청구서: 청구 문구와 청구 금액·입금 기한·입금 계좌 (PDF invoice-a4) */}
              <p className="mt-5 text-sm text-ink">아래와 같이 청구합니다.</p>
              <table className="mt-2 w-full border-collapse border-[1.5px] border-pen text-sm">
                <tbody>
                  <tr className="border-b border-pen-soft">
                    <th className="w-24 bg-pen-soft px-3 py-2 font-semibold text-pen-deep">
                      청구 금액
                    </th>
                    <td className="px-3 py-2">
                      <span className="text-base font-bold text-ink">
                        {koreanAmountSentence(totals.totalAmount)}
                      </span>{" "}
                      <span className="text-xs text-slate-500 tabular-nums">
                        (₩{totals.totalAmount.toLocaleString("ko-KR")})
                        {taxMode === "VAT_10" && " 부가세 포함"}
                      </span>
                    </td>
                  </tr>
                  {form.validUntil && dateLabels.until && (
                    <tr className="border-b border-pen-soft">
                      <th className="bg-pen-soft px-3 py-2 font-semibold text-pen-deep">
                        {dateLabels.until}
                      </th>
                      <td className="px-3 py-2 font-semibold text-ink tabular-nums">
                        {formatDate(form.validUntil)}까지
                      </td>
                    </tr>
                  )}
                  {supplier.bank && (
                    <tr>
                      <th className="bg-pen-soft px-3 py-2 font-semibold text-pen-deep">
                        입금 계좌
                      </th>
                      <td className="px-3 py-2 font-semibold text-ink">
                        {supplier.bank}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p className="mt-3 text-slate-600">
                건명{" "}
                <span className="font-semibold text-ink">
                  {form.title.trim() || "-"}
                </span>
              </p>
            </>
          ) : (
            <section className="mt-5 rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-slate-600">
                건명{" "}
                <span className="font-semibold text-ink">
                  {form.title.trim() || "-"}
                </span>
              </p>
              <p className="mt-1 text-lg font-bold text-ink tabular-nums">
                {taxMode === "WITHHOLDING_3_3" ? "청구 금액" : "합계 금액"}{" "}
                {formatWon(totals.totalAmount)}
                {taxMode === "VAT_10" && (
                  <span className="ml-1 text-xs font-normal text-slate-500">
                    (부가세 포함)
                  </span>
                )}
              </p>
            </section>
          )}
        </>
      )}

      <table className="mt-5 w-full border-collapse">
        <thead>
          <tr className="border-y border-slate-300 bg-slate-50 text-xs text-slate-600">
            <th className="w-8 py-2 font-medium">No</th>
            <th className="py-2 text-left font-medium">
              {preset.columns.find((c) => c.key === "name")?.label ?? "항목"}
            </th>
            <th className="w-14 py-2 text-right font-medium">수량</th>
            {priceColumns.map((c) => (
              <th
                key={c.key}
                className={`${priceColumns.length > 1 ? "w-20" : "w-24"} py-2 text-right font-medium`}
              >
                {c.label}
              </th>
            ))}
            <th className="w-28 py-2 text-right font-medium">금액</th>
          </tr>
        </thead>
        <tbody>
          {filledLines.length === 0 && (
            <tr>
              <td
                colSpan={columnCount}
                className="py-6 text-center text-slate-400"
              >
                품목을 입력하면 여기에 표시됩니다.
              </td>
            </tr>
          )}
          {sections.map(({ group, rows }) => (
            <Fragment key={group?.id ?? "all"}>
              {group && (
                <tr className="border-b border-slate-200 bg-slate-50">
                  <td
                    colSpan={columnCount}
                    className="px-1 py-1.5 font-semibold text-ink"
                  >
                    {group.name.trim() || preset.groupLabel || "묶음"}
                  </td>
                </tr>
              )}
              {rows.map(({ line, amount }) => (
                <tr
                  key={line.id}
                  className="border-b border-slate-100 align-top"
                >
                  <td className="py-2 text-center text-slate-500">
                    {numberOf.get(line.id)}
                  </td>
                  <td className="py-2">
                    <p className="text-ink">{line.name || "-"}</p>
                    {lineDetail(line, preset) && (
                      <p className="text-xs text-slate-500">
                        {lineDetail(line, preset)}
                      </p>
                    )}
                    {optionsColumn && filledOptions(line).length > 0 && (
                      <p className="text-xs text-slate-500">
                        {optionsColumn.label} (참고용, 합계 미포함):{" "}
                        {filledOptions(line)
                          .map(
                            (o) =>
                              `${(parseNumber(o.quantity) ?? 0).toLocaleString("ko-KR")}${line.unit} ${o.amount}원`,
                          )
                          .join(" · ")}
                      </p>
                    )}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {line.quantity || 0}
                    {line.unit && (
                      <span className="text-slate-500"> {line.unit}</span>
                    )}
                  </td>
                  {priceColumns.map((c) => (
                    <td key={c.key} className="py-2 text-right tabular-nums">
                      {(c.key === "unitPrice"
                        ? line.unitPrice
                        : line.extra[c.key]) || 0}
                    </td>
                  ))}
                  <td className="py-2 text-right tabular-nums">
                    {amount.toLocaleString("ko-KR")}
                  </td>
                </tr>
              ))}
              {group && (
                <tr className="border-b border-slate-200">
                  <td
                    colSpan={columnCount - 1}
                    className="py-1.5 text-right font-medium text-slate-600"
                  >
                    {group.name.trim() || preset.groupLabel || "묶음"} 소계
                  </td>
                  <td className="py-1.5 text-right font-medium tabular-nums text-slate-700">
                    {rows
                      .reduce((sum, r) => sum + r.amount, 0)
                      .toLocaleString("ko-KR")}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>

      <dl className="mt-4 ml-auto max-w-xs space-y-1 tabular-nums">
        <div className="flex justify-between">
          <dt className="text-slate-600">
            {preset.useGroups ? "품목 합계" : "소계"}
          </dt>
          <dd>{formatWon(totals.subtotalAmount)}</dd>
        </div>
        {filledSurcharges.map((s) => (
          <div key={s.key} className="flex justify-between">
            <dt className="text-slate-600">
              {s.label} {Number(s.rate)}%
            </dt>
            <dd>{formatWon(s.amount)}</dd>
          </div>
        ))}
        {totals.discountAmount > 0 && (
          <div className="flex justify-between">
            <dt className="text-slate-600">할인</dt>
            <dd>-{formatWon(totals.discountAmount)}</dd>
          </div>
        )}
        {taxMode === "VAT_10" && (
          <>
            <div className="flex justify-between">
              <dt className="text-slate-600">공급가액</dt>
              <dd>{formatWon(totals.supplyAmount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">부가세</dt>
              <dd>{formatWon(totals.taxAmount)}</dd>
            </div>
          </>
        )}
        <div className="flex justify-between border-t border-slate-300 pt-1 font-semibold text-ink">
          <dt>{taxMode === "WITHHOLDING_3_3" ? "청구 금액" : "합계"}</dt>
          <dd>{formatWon(totals.totalAmount)}</dd>
        </div>
        {taxMode === "WITHHOLDING_3_3" && (
          <>
            <div className="flex justify-between text-slate-600">
              <dt>3.3% 공제</dt>
              <dd>-{formatWon(totals.taxAmount)}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>실수령액</dt>
              <dd>{formatWon(totals.netAmount)}</dd>
            </div>
          </>
        )}
      </dl>

      {filledTerms.length > 0 && (
        <section className="mt-6">
          <h3 className="text-xs font-semibold text-slate-500">조건</h3>
          <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {filledTerms.map((field) => {
              const value = form.terms[field.key].trim();
              return (
                <div key={field.key} className="contents">
                  <dt className="text-slate-600">{field.label}</dt>
                  <dd className="text-ink">
                    {field.type === "date" ? formatDate(value) : value}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      )}

      {form.notes.trim() && (
        <section className="mt-6">
          <h3 className="text-xs font-semibold text-slate-500">비고</h3>
          <p className="mt-1 whitespace-pre-wrap">{form.notes}</p>
        </section>
      )}

      <p className="mt-8 text-[11px] text-slate-400">
        참고용 계산이며 실제 세액은 다를 수 있습니다.
      </p>

      {docType === "STATEMENT" && (
        <p className="mt-4 text-right text-sm text-ink">
          위 금액을 정히 인수합니다. 인수자
          <span className="mx-2 inline-block w-32 border-b border-slate-500" />
          (인)
        </p>
      )}
    </article>
  );
}

/** 거래명세서의 공급받는자·공급자 칸 (이름 | 값 표). 빈 값은 빈 칸으로 둔다 */
function PartyGrid({
  title,
  rows,
}: {
  title: string;
  rows: [string, React.ReactNode][];
}) {
  return (
    <table className="w-full border-collapse border border-slate-400 text-xs">
      <caption className="border border-b-0 border-slate-400 bg-slate-50 py-1 text-center font-semibold text-ink">
        {title}
      </caption>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-slate-200">
            <th className="w-16 border-r border-slate-200 bg-slate-50 px-2 py-1 text-center font-normal text-slate-600">
              {label}
            </th>
            <td className="px-2 py-1 text-ink">
              {typeof value === "string" ? value.trim() : value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** 합계를 한글로 쓴 줄: "합계 금액 | 일금 오백육만원정 (₩5,060,000)" */
function AmountInWords({
  label,
  total,
  vat,
}: {
  label: string;
  total: number;
  vat: boolean;
}) {
  return (
    <div className="mt-3 flex items-center border border-slate-400 text-sm">
      <span className="w-24 shrink-0 self-stretch border-r border-slate-200 bg-slate-50 px-3 py-2 text-center text-slate-600">
        {label}
      </span>
      <span className="px-3 py-2">
        <span className="text-base font-bold text-ink">
          {koreanAmountSentence(total)}
        </span>{" "}
        <span className="text-xs text-slate-500 tabular-nums">
          (₩{total.toLocaleString("ko-KR")}){vat && " 부가세 포함"}
        </span>
      </span>
    </div>
  );
}
