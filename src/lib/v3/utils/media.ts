
// 공식 채널 및 방송명 리스트 (통합용)
export const OFFICIAL_TARGETS = [
    "성시경", "또간집", "쯔양", "히밥", "입짧은햇님", "백종원", "곽튜브", "최자로드", "풍자",
    "식객 허영만의 백반기행", "2TV 생생정보", "생활의 달인", "맛있는 녀석들", "전지적 참견 시점",
    "백종원의 골목식당", "줄 서는 식당", "토요일은 밥이 좋아", "생방송 투데이"
];

export const normalizeMediaName = (rawName: string) => {
    if (!rawName) return "";
    const lower = rawName.toLowerCase().replace(/\s+/g, "");

    // 1. 공식 리스트에서 포함 관계 확인
    for (const target of OFFICIAL_TARGETS) {
        const lowerTarget = target.toLowerCase().replace(/\s+/g, "");
        if (lower.includes(lowerTarget)) return target;
    }

    // 2. 영어 이름 처리
    if (lower.includes("sungsikyung")) return "성시경";
    if (lower.includes("paikjongwon") || lower.includes("paik'scooking")) return "백종원";

    return rawName;
};
