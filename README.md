# quotation_frontend

업종별 견적서 서비스의 화면(Next.js + TypeScript). 전체 설계는 상위 폴더의 `TECH_SPEC.md` 참고.

## 실행

```bash
npm install
copy .env.example .env.local   # 맥·리눅스는 cp
npm run dev
```

http://localhost:3000 에서 확인한다.

## 백엔드 연결

브라우저는 `/api/*` 로만 요청하고, `next.config.ts` 의 rewrites 가 `BACKEND_URL` 로 넘긴다.
백엔드를 8080 포트로 띄운 뒤 http://localhost:3000/api/health 를 열어 `{"status":"ok"}` 가 나오면 연결된 것이다.

## 폴더

| 경로 | 내용 |
|---|---|
| `app/(marketing)` | 메인(업종 카드), 업종 소개, 이용약관·개인정보처리방침, 첫 로그인 동의(`welcome`) |
| `app/(app)/(wide)` | 견적서 작성·수정 (넓은 폭): `documents/DocumentEditor.tsx`, `new`, `[id]` |
| `app/(app)/(standard)` | 내 문서 목록, 내 정보·거래처 설정 (보통 폭) |
| `app/login` | 소셜 로그인 버튼 (로그인 뒤 돌아갈 곳을 쿠키에 남김) |
| `components` | 공통 화면 조각 |
| `components/document` | 견적서 미리보기 |
| `lib/api` | 백엔드 호출 함수 (`api.documents.*` 포함) |
| `lib/document` | 문서 API 형식, 작성 화면 입력값 ↔ API 요청 변환 |
| `lib/auth.ts` | 로그인 뒤 돌아갈 곳, 로그인 상태 바뀜 알림 |
| `lib/site.ts` | 서비스·운영자 정보 (약관·방침이 씀, 출시 전에 채움) |
| `lib/calc` | 합계 계산 (백엔드 `calc` 패키지와 같은 규칙) |
| `lib/preset` | 업종 설정 형식과 프리랜서 설정 |

## 확인 명령

```bash
npm run lint
npm run build
```
