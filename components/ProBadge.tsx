// 유료(PRO) 요금제 기능 표시. 결제를 붙이기 전에는 모두에게 열려 있다 (서버 PAID_FEATURES_OPEN)
export default function ProBadge({
  className = "ml-1.5",
}: {
  className?: string;
}) {
  return (
    <span
      className={`rounded bg-pen-soft px-1 py-px text-[10px] font-semibold tracking-wide text-pen ${className}`}
      title="PRO 요금제 기능 (지금은 모두에게 열려 있습니다)"
    >
      PRO
    </span>
  );
}
