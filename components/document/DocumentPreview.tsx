import { formatWon, type Totals } from "@/lib/calc";
import { formatDate } from "@/lib/format";
import type { DocumentForm } from "@/lib/document/form";
import { partyView, type PartyView } from "@/lib/party/types";
import type { Preset } from "@/lib/preset/types";

// 작성 화면 오른쪽의 실시간 미리보기. 입력값을 견적서 모양으로 그리기만 한다.
// 금액은 화면 계산값이며, 저장하면 서버가 같은 규칙으로 다시 계산한다.

export default function DocumentPreview({
  preset,
  form,
  totals,
  docNo,
  supplier,
  heading = "견적서",
}: {
  preset: Preset;
  form: DocumentForm;
  totals: Totals;
  docNo?: string;
  /** 공급자 칸. 고른 내 정보 또는 문서에 남아 있는 공급자 */
  supplier: PartyView;
  heading?: string;
}) {
  const { taxMode } = form;
  const receiver = partyView(form.client);
  const filledTerms = preset.termFields.filter(
    (field) => (form.terms[field.key] ?? "").trim() !== "",
  );
  const filledLines = form.lines
    .map((line, i) => ({ line, amount: totals.lineAmounts[i] }))
    .filter(({ line }) => line.name.trim() !== "" || line.unitPrice !== "");

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 text-[13px] leading-relaxed text-slate-800 shadow-sm sm:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-slate-800 pb-4">
        <h2 className="text-2xl font-bold tracking-[0.3em] text-slate-900">
          {heading}
        </h2>
        <dl className="grid grid-cols-[auto_auto] gap-x-3 text-xs text-slate-600">
          {docNo && (
            <>
              <dt>문서 번호</dt>
              <dd className="text-right tabular-nums">{docNo}</dd>
            </>
          )}
          <dt>작성일</dt>
          <dd className="text-right tabular-nums">
            {form.issueDate ? formatDate(form.issueDate) : "-"}
          </dd>
          {form.validUntil && (
            <>
              <dt>유효기간</dt>
              <dd className="text-right tabular-nums">
                {formatDate(form.validUntil)}까지
              </dd>
            </>
          )}
        </dl>
      </header>

      <section className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold text-slate-500">받는 분</h3>
          <p className="mt-1 text-base font-semibold text-slate-900">
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
              <p className="mt-1 text-base font-semibold text-slate-900">
                {supplier.name}
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

      <section className="mt-5 rounded-lg bg-slate-50 px-4 py-3">
        <p className="text-slate-600">
          건명{" "}
          <span className="font-semibold text-slate-900">
            {form.title.trim() || "-"}
          </span>
        </p>
        <p className="mt-1 text-lg font-bold text-slate-900 tabular-nums">
          {taxMode === "WITHHOLDING_3_3" ? "청구 금액" : "합계 금액"}{" "}
          {formatWon(totals.totalAmount)}
          {taxMode === "VAT_10" && (
            <span className="ml-1 text-xs font-normal text-slate-500">
              (부가세 포함)
            </span>
          )}
        </p>
      </section>

      <table className="mt-5 w-full border-collapse">
        <thead>
          <tr className="border-y border-slate-300 bg-slate-50 text-xs text-slate-600">
            <th className="w-8 py-2 font-medium">No</th>
            <th className="py-2 text-left font-medium">
              {preset.columns.find((c) => c.key === "name")?.label ?? "항목"}
            </th>
            <th className="w-14 py-2 text-right font-medium">수량</th>
            <th className="w-24 py-2 text-right font-medium">단가</th>
            <th className="w-28 py-2 text-right font-medium">금액</th>
          </tr>
        </thead>
        <tbody>
          {filledLines.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-slate-400">
                품목을 입력하면 여기에 표시됩니다.
              </td>
            </tr>
          )}
          {filledLines.map(({ line, amount }, i) => (
            <tr key={line.id} className="border-b border-slate-100 align-top">
              <td className="py-2 text-center text-slate-500">{i + 1}</td>
              <td className="py-2">
                <p className="text-slate-900">{line.name || "-"}</p>
                {line.description.trim() && (
                  <p className="text-xs text-slate-500">{line.description}</p>
                )}
              </td>
              <td className="py-2 text-right tabular-nums">
                {line.quantity || 0}
                {line.unit && (
                  <span className="text-slate-500"> {line.unit}</span>
                )}
              </td>
              <td className="py-2 text-right tabular-nums">
                {line.unitPrice || 0}
              </td>
              <td className="py-2 text-right tabular-nums">
                {amount.toLocaleString("ko-KR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="mt-4 ml-auto max-w-xs space-y-1 tabular-nums">
        <div className="flex justify-between">
          <dt className="text-slate-600">소계</dt>
          <dd>{formatWon(totals.subtotalAmount)}</dd>
        </div>
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
        <div className="flex justify-between border-t border-slate-300 pt-1 font-semibold text-slate-900">
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
                  <dd className="text-slate-900">
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
    </article>
  );
}
