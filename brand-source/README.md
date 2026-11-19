# 대표 이미지·아이콘 원본

`app/opengraph-image.png`(1200×630), `app/icon1.png`(32), `app/icon2.png`(128), `app/apple-icon.png`(180),
`assets/brand/app-icon-128.png`(카카오 앱 아이콘)은 이 폴더의 코드로 그린 그림이다.

예전에는 이 코드가 `app/` 안에서 요청마다 그림을 그렸지만, Cloudflare Workers 에서는 실행 중에 글꼴 파일(`assets/og`)을
읽을 수 없어서 2026-11-19 부터 미리 그린 PNG 를 쓴다.

## 다시 그리는 방법

1. 이 폴더의 `opengraph-image.tsx`·`icon.tsx`·`apple-icon.tsx` 를 `app/` 로 잠깐 옮기고 `og.tsx` 를 `lib/og.tsx` 로 (import 경로를 `@/lib/og` 로)
2. `app/` 의 같은 이름 PNG 를 잠깐 치우고 `npm run build && npx next start`
3. `/opengraph-image`, `/icon/32`, `/icon/128`, `/apple-icon` 을 받아 PNG 로 저장 → 위 파일 이름으로 `app/` 에 넣는다
4. 옮긴 코드는 다시 이 폴더로

글자를 바꾸면 `assets/og` 의 글꼴(쓰는 글자만 담은 고운바탕)도 다시 받아야 한다 (Google Fonts css2 `?text=`).
