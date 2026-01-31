export const CATEGORY_MAP: Record<string, string[]> = {
    '한식': ['한식', '냉면', '불고기', '비빔밥', '찜', '탕', '찌개', '고기', '곱창', '막창', '해장국', '국밥', '백반', '정식', '족발', '보쌈', '삼겹살', '고깃집', '국수', '칼국수', '해물', '아구찜', '전', '부침개', '쌈밥', '생선구이', '곰탕', '순대국'],
    '중식': ['중식', '중국집', '짜장면', '짬뽕', '마라탕', '양꼬치', '딤섬', '양장피', '탕수육'],
    '일식': ['일식', '초밥', '스시', '돈가스', '우동', '라멘', '이자카야', '회', '횟집', '소바', '텐동', '가츠동', '참치', '오뎅'],
    '양식': ['양식', '이탈리안', '프렌치', '스테이크', '파스타', '피자', '햄버거', '레스토랑', '브런치', '와인바', '펍', '호프'],
    '분식': ['분식', '떡볶이', '김밥', '라면', '튀김', '순대'],
    '기타': ['카페', '디저트', '베이커리', '술집', '포차', '치킨', '패스트푸드', '동남아', '베트남', '태국', '인도', '멕시칸', '커피', '샌드위치', '전통찻집', '베이글', '도넛', '타코']
};

export const checkCategoryMatch = (place: Place, filterCategories: string[]) => {
    if (filterCategories.length === 0) return true;
    const { category, name, menu_primary, best_comment } = place;
    if (!category) return filterCategories.includes('기타');

    // 카테고리 문자열을 단어 단위로 분리 (쉼표, 공백, '>' 기준)
    const placeTags = category.split(/[,\s>]+/).filter(tag => tag.length > 0);
    const fullName = name.toLowerCase();
    const menu = (place.menu_primary || '').toLowerCase(); // menu_primary로 변경
    const desc = (best_comment || '').toLowerCase();
    const isSundaeguk = fullName.includes('순대국') || menu.includes('순대국') || menu.includes('순대 국') || desc.includes('순대국');

    // 한식의 강력한 지표들 (이 단어들이 있으면 분식에서 제외)
    const strongHansikIndicators = ['한식', '국밥', '해장국', '탕', '찌개', '백반', '정식', '노포'];
    // 식사류임을 암시하는 설명글 키워드
    const mealIndicators = ['국물', '해장', '반주', '소주', '밥', '식사', '수육', '머리고기'];

    const hasHansikIndicator = placeTags.some(tag => strongHansikIndicators.includes(tag)) ||
        strongHansikIndicators.some(ind => menu.includes(ind)) ||
        (placeTags.includes('순대') && mealIndicators.some(ind => desc.includes(ind)));

    return filterCategories.some(filterCat => {
        // 0. 시각적인 상호명 및 대표 메뉴 기반 강제 분류 (순대국은 무조건 한식)
        if (filterCat === '한식' && isSundaeguk) return true;

        // [강력 배제] 한식 지표가 있거나 순대국인 경우 분식 필터에서 원천 차단
        if (filterCat === '분식' && (isSundaeguk || (hasHansikIndicator && placeTags.includes('순대')))) return false;

        if (placeTags.includes(filterCat)) return true;
        const subCats = CATEGORY_MAP[filterCat];

        if (subCats) {
            return subCats.some(sub => {
                // 1. 단어 기반 완전 일치 확인
                if (placeTags.includes(sub)) {
                    // 예외: 태그가 '순대'여도 한식 지표가 뚜렷하면 분식 매칭 차단
                    if (filterCat === '분식' && sub === '순대' && (isSundaeguk || hasHansikIndicator)) return false;
                    return true;
                }

                // 2. 부분 일치 확인 (단, 예외 케이스 처리)
                return placeTags.some(tag => {
                    if (tag.includes(sub)) {
                        // 예외: '순대'가 포함되어도 한식 맥락인 경우 분식에서 제외
                        if (filterCat === '분식' && sub === '순대' && (tag.includes('순대국') || isSundaeguk || hasHansikIndicator)) return false;
                        // 예외: '라면'이 포함되어도 '라멘'인 경우 분식 분류에서 제외
                        if (filterCat === '분식' && sub === '라면' && (tag.includes('라멘') || fullName.includes('라멘') || menu.includes('라멘'))) return false;
                        return true;
                    }
                    return false;
                });
            });
        }
        return false;
    });
};

export interface Place {
    id: number | string;
    name: string;
    name_official?: string;
    lat: number;
    lng: number;
    channel_title: string; // v1.6: 기존 channels
    media_label?: string;
    video_url: string;
    video_id?: string;
    best_comment: string;
    best_comment_like_count?: number;
    address: string;
    road_address?: string;
    phone?: string;
    category?: string;
    menu_primary?: string; // v1.6: 기존 top_menus
    image_url: string;     // v1.6: 기존 menu_image_url
    video_thumbnail_url?: string;
    image_state?: string;
    updated_at?: string;
}

export const DUMMY_PLACES: Place[] = [];
