// 링크 끝의 작은 화살표 (글자 → 대신 그린 아이콘)
export default function ArrowRight({
  className = "size-3.5",
}: {
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8h10m0 0-4-4m4 4-4 4" />
    </svg>
  );
}
