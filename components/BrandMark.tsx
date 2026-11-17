// 바로 한장 로고 표시: 인주 빨강 도장 + 명조 글자. 도장 빨강(seal)은 여기와 첫 화면 도장에만 쓴다.

/** 사각 도장. 글자는 세로로 "한장" */
export function Seal({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex flex-col items-center justify-center rounded-[3px] border-[1.5px] border-seal font-display leading-none font-bold text-seal ${className}`}
    >
      <span>한</span>
      <span>장</span>
    </span>
  );
}

export default function BrandMark() {
  return (
    <span className="inline-flex items-center gap-2">
      <Seal className="h-7 w-7 text-[11px]" />
      <span className="font-display text-lg font-bold tracking-tight text-ink">
        바로 한장
      </span>
    </span>
  );
}
