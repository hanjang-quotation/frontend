// 메인 화면의 업종 카드 목록. 업종을 추가할 때 여기에 한 줄을 더한다.

export interface Industry {
  code: string;
  name: string;
  description: string;
  examples: string;
  /** 소개 페이지와 작성 화면이 준비되었는지 */
  ready: boolean;
}

export const industries: Industry[] = [
  {
    code: "freelancer",
    name: "프리랜서",
    description: "디자인·개발·영상 외주 견적서",
    examples: "작업 범위, 수정 횟수, 납기일, 3.3% 공제",
    ready: true,
  },
  {
    code: "event",
    name: "행사·케이터링",
    description: "인원수 기준 행사 견적서",
    examples: "인원 × 1인 단가, 출장비, 행사일·장소, 부가세 별도",
    ready: true,
  },
  {
    code: "construction",
    name: "인테리어·시공",
    description: "공종별 시공 견적서",
    examples: "공종 묶음, 자재비·인건비, 면적 단위",
    ready: false,
  },
  {
    code: "printing",
    name: "인쇄·제작",
    description: "사양별 인쇄 견적서",
    examples: "규격, 용지, 수량 구간, 후가공",
    ready: false,
  },
];
