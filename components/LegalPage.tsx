// 이용약관·개인정보처리방침 공통 틀. 본문은 Article 로 조항을 나눈다.

export function LegalPage({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  /** 시행일 YYYY-MM-DD */
  effectiveDate: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 text-sm leading-relaxed text-slate-700">
      <h1 className="font-display text-3xl font-bold text-ink">{title}</h1>
      <p className="mt-1 text-xs text-slate-500">시행일 {effectiveDate}</p>
      <div className="mt-8 space-y-8">{children}</div>
    </article>
  );
}

export function Article({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <div className="mt-2 space-y-2 [&_li]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ul]:list-disc [&_ul]:space-y-1">
        {children}
      </div>
    </section>
  );
}

/** 표 (개인정보 항목, 위탁·국외 이전 등) */
export function LegalTable({
  head,
  rows,
}: {
  head: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-xs">
        <thead>
          <tr>
            {head.map((h) => (
              <th
                key={h}
                className="border border-rule bg-slate-50 p-2 text-left font-medium text-slate-700"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="border border-rule p-2 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
