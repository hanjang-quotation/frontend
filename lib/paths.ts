// 화면 주소를 한 곳에서 만든다. 정적 내보내기(output: "export")로도 띄울 수 있게
// 요청 때 정해지는 값(문서 번호, 공유 토큰)은 경로가 아니라 ?쿼리로 넘긴다.
// 예전 주소(/documents/5, /s/토큰)는 next.config.ts·호스팅 설정이 새 주소로 넘긴다.

/** 저장된 문서의 수정 화면. saved 면 "저장했습니다" 안내를 띄운다 */
export function documentPath(id: number | string, saved = false): string {
  return `/documents/edit?id=${encodeURIComponent(String(id))}${saved ? "&saved=1" : ""}`;
}

/** 공유 링크로 보는 화면 */
export function sharePath(token: string): string {
  return `/s?t=${encodeURIComponent(token)}`;
}
