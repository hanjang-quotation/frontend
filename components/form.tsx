// 입력 화면 공통 부품. 작성 화면과 설정 화면(내 정보·거래처)이 같이 쓴다.

export const inputClass =
  "w-full rounded-md border border-slate-300 bg-paper px-2.5 py-1.5 text-sm focus:border-pen focus:outline-none";

const labelClass = "mb-1 block text-xs font-medium text-slate-600";

/** 흰 상자 하나. action 은 제목 오른쪽에 붙는다 (예: "관리" 링크) */
export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-rule bg-paper p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** 이름표 + 입력란 */
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}
