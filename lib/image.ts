// 로고·도장 이미지. 올리기 전에 브라우저에서 줄여(종류별 크기 상한, 300KB 이하) 보낸다.
// 백엔드 image 패키지(ImageKind 의 크기 상한, ImageService.MAX_BYTES)와 맞춘다.

export type ImageKind = "LOGO" | "STAMP";

export interface UploadedImage {
  id: number;
  kind: ImageKind;
  width: number;
  height: number;
}

/** 줄이는 크기 (백엔드 상한보다 작게) */
const MAX_SIZE: Record<ImageKind, { width: number; height: number }> = {
  LOGO: { width: 600, height: 300 },
  STAMP: { width: 300, height: 300 },
};
const MAX_BYTES = 300 * 1024;

/** 저장된 이미지 주소 (로그인한 본인) */
export function imageUrl(id: number): string {
  return `/api/images/${id}`;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, quality),
  );
}

/**
 * 이미지 파일을 종류별 크기 안으로 줄여 PNG 로 만든다 (투명 배경 유지).
 * PNG 가 300KB 를 넘으면 흰 배경 JPEG 로 바꾼다. 읽을 수 없는 파일이면 오류
 */
export async function shrinkImage(file: Blob, kind: ImageKind): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const max = MAX_SIZE[kind];
  const scale = Math.min(
    1,
    max.width / bitmap.width,
    max.height / bitmap.height,
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 처리하지 못했습니다.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const png = await toBlob(canvas, "image/png");
  if (png && png.size <= MAX_BYTES) return png;

  // 큰 사진은 JPEG 로 (투명한 곳은 흰색)
  const flat = document.createElement("canvas");
  flat.width = canvas.width;
  flat.height = canvas.height;
  const fctx = flat.getContext("2d");
  if (!fctx) throw new Error("이미지를 처리하지 못했습니다.");
  fctx.fillStyle = "#ffffff";
  fctx.fillRect(0, 0, flat.width, flat.height);
  fctx.drawImage(canvas, 0, 0);
  for (const quality of [0.9, 0.8, 0.7, 0.6]) {
    const jpeg = await toBlob(flat, "image/jpeg", quality);
    if (jpeg && jpeg.size <= MAX_BYTES) return jpeg;
  }
  throw new Error("이미지가 너무 큽니다. 더 작은 이미지를 올려 주세요.");
}

/**
 * 이름으로 도장 그리기: 빨간 사각 테두리 안에 글자를 오른쪽 세로줄부터 위에서 아래로 (예: 한장인테리어인).
 * 끝에 "인"을 붙인다 (이미 "인"으로 끝나면 그대로). 글꼴은 사이트의 명조(고운바탕)
 */
export async function drawStamp(text: string): Promise<HTMLCanvasElement> {
  const chars = [...text.replace(/\s+/g, "")].slice(0, 8);
  if (chars.length === 0) throw new Error("도장에 넣을 이름을 입력해 주세요.");
  if (chars[chars.length - 1] !== "인") chars.push("인");

  const size = 240;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("도장을 그리지 못했습니다.");

  const color = "#c9342b";
  const border = 12;
  ctx.strokeStyle = color;
  ctx.lineWidth = border;
  ctx.strokeRect(
    border / 2 + 4,
    border / 2 + 4,
    size - border - 8,
    size - border - 8,
  );

  // 칸 나누기: 글자 수에 맞춰 세로줄 수를 정한다 (오른쪽 줄부터 위→아래)
  const cols = chars.length <= 2 ? 1 : chars.length <= 4 ? 2 : 3;
  const rows = Math.ceil(chars.length / cols);
  const inner = size - border * 2 - 24;
  const cellW = inner / cols;
  const cellH = inner / rows;
  const fontSize = Math.floor(Math.min(cellW, cellH) * 0.86);

  const family =
    getComputedStyle(document.body).getPropertyValue("--font-gowun").trim() ||
    "serif";
  const font = `700 ${fontSize}px ${family}`;
  try {
    await document.fonts.load(font, chars.join(""));
  } catch {
    // 글꼴을 못 불러오면 기본 명조로 그린다
  }
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const left = border + 12;
  const top = border + 12;
  chars.forEach((ch, i) => {
    const col = cols - 1 - Math.floor(i / rows);
    const row = i % rows;
    ctx.fillText(ch, left + cellW * (col + 0.5), top + cellH * (row + 0.5));
  });
  return canvas;
}

/**
 * AI 로 읽을 사진을 줄인다: 긴 변 2000px 이하 JPEG (글자를 읽을 만큼은 남기고 올리기는 빠르게).
 * 휴대폰 사진(수 MB)도 보통 0.5~1.5MB 가 된다. 서버 상한은 8MB
 */
export async function shrinkPhoto(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("사진을 처리하지 못했습니다.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.88, 0.8, 0.7]) {
    const jpeg = await toBlob(canvas, "image/jpeg", quality);
    if (jpeg && jpeg.size <= 7 * 1024 * 1024) return jpeg;
  }
  throw new Error("사진이 너무 큽니다. 다른 사진으로 해 주세요.");
}
