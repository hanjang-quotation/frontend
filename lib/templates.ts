// 빈 양식 페이지 (/templates/estimate·statement·invoice) 내용.
// "견적서 양식" 같은 검색어로 들어온 사람이 엑셀 양식을 받아 가고, 쓰다가 바로 한장에 다시 올리게 하는 길이다.
// 양식 파일은 백엔드가 업종 설정으로 만든다: GET /api/public/templates/{key}.xlsx | .pdf (로그인 없이)

import type { DocType } from "@/lib/document/types";

export type TemplatePageKey = "estimate" | "statement" | "invoice";

export interface TemplateFile {
  /** 백엔드 양식 이름 (TemplateService.KINDS) */
  key: string;
  /** 업종 설정 코드 (미리보기용) */
  presetCode: string;
  /** 고르는 칸의 이름. 양식이 하나뿐이면 쓰지 않는다 */
  label?: string;
  /** 고르는 칸 아래 한 줄 */
  hint?: string;
}

export interface TemplatePageContent {
  key: TemplatePageKey;
  docType: DocType;
  /** 문서 이름: 견적서·거래명세서·청구서 */
  name: string;
  /** 검색 결과 제목 */
  metaTitle: string;
  metaDescription: string;
  /** 첫 문단 */
  intro: string;
  /** 첫 화면 "빈 양식 받기" 줄에 쓰는 짧은 설명 */
  summary: string;
  files: TemplateFile[];
  /** 꼭 들어가는 항목 */
  items: { term: string; body: string }[];
  faq: { q: string; a: string }[];
}

/** 견적서 양식 페이지에서 그 업종을 골라 둔 주소 */
export const estimateTemplatePath = (presetCode: string) =>
  `/templates/estimate?industry=${presetCode}`;

export const templateUrl = (key: string, ext: "xlsx" | "pdf") =>
  `/api/public/templates/${key}.${ext}`;

const commonFaq = (name: string) => [
  {
    q: `${name} 양식은 무료인가요?`,
    a: "네. 로그인 없이 엑셀과 인쇄용 PDF를 받을 수 있습니다. 받은 엑셀을 바로 한장에 다시 올려 정리하는 것도 무료입니다.",
  },
  {
    q: "엑셀에 계산식이 들어 있나요?",
    a: "수량과 단가를 넣으면 금액, 소계, 세금, 합계가 자동으로 계산됩니다. 계산 결과는 참고용이니 보내기 전에 한 번 확인해 주세요.",
  },
  {
    q: "엑셀로 쓰던 걸 바로 한장으로 옮길 수 있나요?",
    a: "받은 양식에 쓴 엑셀을 새 견적서 화면의 '엑셀 파일 열기'로 올리면 그대로 열립니다. 다른 양식의 엑셀이나 PDF, 종이 견적서 사진은 'AI 로 가져오기'로 읽어 올 수 있습니다.",
  },
  {
    q: "한글(.hwp) 양식도 있나요?",
    a: "지금은 엑셀과 PDF만 제공합니다. 한글 문서로 쓰던 내용은 바로 한장에서 직접 작성하거나 PDF로 저장해 'AI 로 가져오기'로 올려 주세요.",
  },
];

export const TEMPLATE_PAGES: Record<TemplatePageKey, TemplatePageContent> = {
  estimate: {
    key: "estimate",
    docType: "ESTIMATE",
    name: "견적서",
    summary: "업종별 4종. 합계·부가세·3.3% 계산식",
    metaTitle: "견적서 양식 무료 다운로드 (엑셀·PDF)",
    metaDescription:
      "업종에 맞는 칸이 들어간 견적서 엑셀 양식을 로그인 없이 받으세요. 프리랜서, 행사·케이터링, 인테리어·시공, 인쇄·제작. 합계와 부가세·3.3% 계산식 포함.",
    intro:
      "업종마다 필요한 칸이 다릅니다. 하는 일에 맞는 양식을 골라 엑셀로 받으세요. 수량과 단가만 넣으면 합계와 세금이 계산됩니다.",
    files: [
      {
        key: "estimate-freelancer",
        presetCode: "freelancer",
        label: "프리랜서",
        hint: "디자인·개발 외주. 3.3% 공제 계산",
      },
      {
        key: "estimate-event",
        presetCode: "event",
        label: "행사·케이터링",
        hint: "인원·일정, 부가세 계산",
      },
      {
        key: "estimate-construction",
        presetCode: "construction",
        label: "인테리어·시공",
        hint: "공종별, 자재·노무 단가 따로",
      },
      {
        key: "estimate-printing",
        presetCode: "printing",
        label: "인쇄·제작",
        hint: "용지·인쇄·후가공 사양",
      },
    ],
    items: [
      {
        term: "받는 분",
        body: "견적을 받는 회사나 사람의 이름. 담당자와 연락처를 함께 적으면 좋습니다.",
      },
      {
        term: "공급자",
        body: "견적을 내는 쪽. 상호, 사업자번호, 연락처, 주소를 적습니다.",
      },
      {
        term: "건명",
        body: "무엇에 대한 견적인지 한 줄로. 예: 회사 소개 홈페이지 제작",
      },
      {
        term: "품목",
        body: "품명, 규격, 수량, 단위, 단가, 금액. 금액은 수량 × 단가입니다.",
      },
      {
        term: "합계와 세금",
        body: "부가세 별도면 공급가액에 10%를 더하고, 프리랜서 3.3% 원천징수면 공제 후 실수령액을 함께 적습니다.",
      },
      {
        term: "유효기간",
        body: "이 금액이 언제까지 유효한지. 자재값이 자주 바뀌는 업종이라면 꼭 적어 두세요.",
      },
    ],
    faq: commonFaq("견적서"),
  },
  statement: {
    key: "statement",
    docType: "STATEMENT",
    name: "거래명세서",
    summary: "공급가액·부가세·합계 계산식",
    metaTitle: "거래명세서 양식 무료 다운로드 (엑셀·PDF)",
    metaDescription:
      "거래명세서 엑셀 양식을 로그인 없이 받으세요. 공급가액·부가세·합계 계산식 포함, 인쇄용 PDF도 있습니다.",
    intro:
      "물건이나 일을 넘겨준 뒤, 무엇을 얼마에 거래했는지 확인하는 문서입니다. 엑셀로 받아 수량과 단가만 넣으면 부가세와 합계가 계산됩니다.",
    files: [{ key: "statement", presetCode: "freelancer" }],
    items: [
      {
        term: "공급받는자·공급자",
        body: "거래한 두 쪽의 상호, 사업자번호, 대표자, 주소, 연락처.",
      },
      { term: "거래일", body: "물건이나 일을 넘겨준 날." },
      {
        term: "품목",
        body: "품명, 규격, 수량, 단위, 단가, 금액. 견적서와 같은 내용이면 그대로 옮겨 적습니다.",
      },
      {
        term: "공급가액·부가세·합계",
        body: "공급가액에 부가세 10%를 더한 금액이 합계입니다. 합계를 한글로 함께 적기도 합니다(예: 일금 오백만원정).",
      },
      {
        term: "인수자 확인",
        body: "받은 쪽이 확인했다는 서명이나 도장을 받는 칸.",
      },
    ],
    faq: commonFaq("거래명세서"),
  },
  invoice: {
    key: "invoice",
    docType: "INVOICE",
    name: "청구서",
    summary: "청구 금액 계산식, 입금 기한·계좌 칸",
    metaTitle: "청구서 양식 무료 다운로드 (엑셀·PDF)",
    metaDescription:
      "청구서 엑셀 양식을 로그인 없이 받으세요. 청구 금액·부가세 계산식, 입금 기한과 입금 계좌 칸 포함.",
    intro:
      "일이 끝난 뒤 대금을 요청하는 문서입니다. 엑셀로 받아 품목만 채우면 청구 금액이 계산됩니다. 입금 기한과 입금 계좌를 꼭 적어 주세요.",
    files: [{ key: "invoice", presetCode: "freelancer" }],
    items: [
      { term: "받는 분", body: "대금을 낼 회사나 사람의 이름." },
      { term: "청구일·입금 기한", body: "청구한 날과 입금을 받아야 하는 날." },
      { term: "품목", body: "청구하는 일이나 물건, 수량, 단가, 금액." },
      {
        term: "청구 금액",
        body: "공급가액과 부가세를 더한 금액. 한글로 함께 적으면 금액을 잘못 읽을 일이 줄어듭니다.",
      },
      {
        term: "입금 계좌",
        body: "은행, 계좌번호, 예금주. 사업자 계좌를 적는 것이 좋습니다.",
      },
    ],
    faq: commonFaq("청구서"),
  },
};

export const TEMPLATE_PAGE_LIST: TemplatePageContent[] = [
  TEMPLATE_PAGES.estimate,
  TEMPLATE_PAGES.statement,
  TEMPLATE_PAGES.invoice,
];
