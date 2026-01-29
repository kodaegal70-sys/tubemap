export const CATEGORY_MAP: Record<string, string[]> = {
    '한식': ['한식', '냉면', '불고기', '비빔밥', '찜', '탕', '찌개', '고기', '곱창', '막창', '해장국', '국밥', '백반', '정식', '족발', '보쌈', '삼겹살', '고깃집', '국수', '칼국수', '해물', '아구찜', '전', '부침개', '쌈밥', '생선구이', '곰탕', '순대국'],
    '중식': ['중식', '중국집', '짜장면', '짬뽕', '마라탕', '양꼬치', '딤섬', '양장피', '탕수육'],
    '일식': ['일식', '초밥', '스시', '돈가스', '우동', '라멘', '이자카야', '회', '횟집', '소바', '텐동', '가츠동', '참치', '오뎅'],
    '양식': ['양식', '이탈리안', '프렌치', '스테이크', '파스타', '피자', '햄버거', '레스토랑', '브런치', '와인바', '펍', '호프'],
    '분식': ['분식', '떡볶이', '김밥', '라면', '튀김', '순대'],
    '기타': ['카페', '디저트', '베이커리', '술집', '포차', '치킨', '패스트푸드', '동남아', '베트남', '태국', '인도', '멕시칸', '커피', '샌드위치', '전통찻집', '베이글', '도넛', '타코']
};

export const checkCategoryMatch = (place: { name: string, category?: string, representMenu?: string, menu_primary?: string, description?: string }, filterCategories: string[]) => {
    if (filterCategories.length === 0) return true;
    const { category, name, representMenu, menu_primary, description } = place;
    if (!category) return filterCategories.includes('기타');

    // 카테고리 문자열을 단어 단위로 분리 (쉼표, 공백, '>' 기준)
    const placeTags = category.split(/[,\s>]+/).filter(tag => tag.length > 0);
    const fullName = name.toLowerCase();
    const menu = (representMenu || menu_primary || '').toLowerCase();
    const desc = (description || '').toLowerCase();
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
    id: number | string; // Support UUID from DB
    name: string;
    lat: number;
    lng: number;
    media: string; // Legacy format "Channel|Program", v1.6 uses media_label
    media_label?: string; // v1.6 New
    channel_title?: string; // v1.6 New
    video_url?: string; // v1.6 New
    description?: string;
    best_comment?: string; // v1.6 New
    best_comment_like_count?: number; // v1.6 New
    address: string;
    road_address?: string; // v1.6 New
    phone?: string;
    naver_url?: string;
    google_maps_url?: string;
    category?: string;
    representMenu?: string;
    menu_primary?: string; // DB field name
    image_url?: string;
    image_state?: 'approved' | 'pending'; // v1.6 New
    addressProvince?: string;
    addressCity?: string;
    addressDistrict?: string;
}

export const DUMMY_PLACES: Place[] = [
    {
        "id": 21,
        "name": "화목순대국",
        "lat": 37.519082,
        "lng": 126.930416,
        "media": "성시경|먹을텐데",
        "media_label": "성시경 먹을텐데",
        "channel_title": "성시경 SUNG SI KYUNG",
        "best_comment": "성시경님이 왜 인생 순대국라고 했는지 알겠네요.",
        "best_comment_like_count": 120,
        "description": "성시경님이 왜 인생 순대국라고 했는지 알겠네요. 꼬릿한 내장 고기 풍미가 예술이고 밥이 말아져나와서 토렴된 느낌이 너무 좋습니다. 여의도 오면 무조건 재방문입니다.",
        "address": "서울 영등포구 여의대방로 383",
        "road_address": "서울 영등포구 여의대방로 383",
        "phone": "02-780-8191",
        "naver_url": "https://map.naver.com/p/entry/place/11677320",
        "google_maps_url": "https://www.google.com/maps/search/%ED%99%94%EB%AA%A9%EC%88%9C%EB%8C%80%EA%B5%AD+%EC%84%9C%EC%9A%B8+%EC%98%81%EB%93%B1%ED%8F%AC%EA%B5%AC+%EC%97%AC%EC%9D%98%EB%8C%80%EB%B0%A9%EB%A1%9C+383",
        "category": "한식, 국밥, 순대국",
        "representMenu": "내장탕",
        "addressProvince": "서울",
        "image_state": "approved",
        "image_url": "https://placehold.co/400x400/png" // Dummy
    },
    {
        "id": 22,
        "name": "함경도찹쌀순대",
        "lat": 37.493774,
        "lng": 127.121803,
        "media": "성시경|먹을텐데",
        "description": "가락동의 전설... 수육이 정말 야들야들하고 순대국 국물이 잡내 하나 없이 진국입니다. 깍두기랑 같이 먹으면 끝없이 들어가요. 늘 대기가 길지만 기다릴 가치가 충분합니다.",
        "address": "서울 송파구 송파대로28길 32",
        "phone": "02-403-8822",
        "naver_url": "https://map.naver.com/p/entry/place/11591873",
        "google_maps_url": "https://www.google.com/maps/search/%ED%95%A8%EA%B2%BD%EB%8F%84%EC%B0%B9%EC%8C%80%EC%88%9C%EB%8C%80+%EC%84%9C%EC%9A%B8+%EC%86%A1%ED%8C%8C%EA%B5%AC+%EC%86%A1%ED%8C%8C%EB%8C%80%EB%A1%9C28%EA%B8%B8+32",
        "category": "한식, 국밥, 순대국",
        "representMenu": "수육과 순대국",
        "addressProvince": "서울"
    },
    {
        "id": 23,
        "name": "영동설렁탕",
        "lat": 37.517332,
        "lng": 127.017349,
        "media": "성시경|먹을텐데",
        "description": "압구정에서 술 마신 다음 날 아침에 영동설렁탕 안 가면 섭섭하죠. 큼지막한 고기랑 소면 사리, 그리고 여기만의 시큼한 깍두기 국물 부어 먹는 그 맛은 대체 불가능입니다.",
        "address": "서울 서초구 강남대로101안길 24",
        "phone": "02-543-4716",
        "naver_url": "https://map.naver.com/p/entry/place/11679294",
        "google_maps_url": "https://maps.app.goo.gl/s2pj5MtcMWX4ZjmY6",
        "category": "한식, 설렁탕, 탕",
        "representMenu": "설렁탕",
        "addressProvince": "서울"
    },
    {
        "id": 24,
        "name": "호남식당",
        "lat": 37.562143,
        "lng": 126.996131,
        "media": "또간집|충무로편",
        "description": "쫄갈비 혹은 물갈비라고 불리는 이곳... 양념이 쏙 밴 고기를 쌈 싸 먹다가 마지막에 볶어주시는 볶음밥이 주인공입니다. 노포 분위기도 너무 매력적이에요.",
        "address": "서울 중구 퇴계로41길 9",
        "phone": "02-2273-1348",
        "naver_url": "https://map.naver.com/p/entry/place/13158971",
        "google_maps_url": "https://www.google.com/maps/search/%ED%98%B8%EB%82%A8%EC%8B%9D%EB%8B%B9+%EC%84%9C%EC%9A%B8+%EC%A4%91%EA%B5%AC+%ED%87%B4%EA%B3%84%EB%A1%9C41%EA%B8%B8+9",
        "category": "한식, 돼지갈비, 고기",
        "representMenu": "물갈비",
        "addressProvince": "서울"
    },
    {
        "id": 25,
        "name": "하니칼국수",
        "lat": 37.565147,
        "lng": 127.016301,
        "media": "또간집|신당편",
        "description": "알과 고니가 가득 들어간 칼국수라니 비주얼부터 압도적입니다. 국물이 칼칼하고 시원해서 해장하러 갔다가 술을 더 마시게 되는 마법 같은 곳입니다.",
        "address": "서울 중구 퇴계로 411-15",
        "phone": "02-3298-6909",
        "naver_url": "https://map.naver.com/p/entry/place/1758170252",
        "google_maps_url": "https://www.google.com/maps/search/%ED%95%98%EB%8B%88%EC%B9%BC%EA%B5%AD%EC%88%98+%EC%84%9C%EC%9A%B8+%EC%A4%91%EA%B5%AC+%ED%87%B4%EA%B3%84%EB%A1%9C+411-15",
        "category": "한식, 칼국수, 국수",
        "representMenu": "알곤이칼국수",
        "addressProvince": "서울"
    },
    {
        "id": 26,
        "name": "종로계림닭도리탕원조",
        "lat": 37.570744,
        "lng": 126.993427,
        "media": "백종원|3대천왕",
        "description": "마늘이 산처럼 쌓여 나오는데 끓일수록 알싸하고 달큰한 맛이 올라와요. 닭고기도 부드럽고 떡사리도 쫄깃합니다. 종로 좁은 골목길의 감성이 맛을 더해줍니다.",
        "address": "서울 종로구 돈화문로4길 39",
        "phone": "02-2263-6658",
        "naver_url": "https://map.naver.com/p/entry/place/11617477",
        "google_maps_url": "https://www.google.com/maps/search/%EC%A2%85%EB%A1%9C%EA%B3%84%EB%A6%BC%EB%8B%AD%EB%8F%84%EB%A6%AC%ED%83%95%EC%9B%90%EC%A1%B0+%EC%84%9C%EC%9A%B8+%EC%A2%85%EB%A1%9C%EA%B5%AC+%EB%8F%84%ED%99%94%EB%AC%B8%EB%A1%9C4%EA%B8%B8+39",
        "category": "한식, 닭도리탕, 탕",
        "representMenu": "마늘 닭도리탕",
        "addressProvince": "서울"
    },
    {
        "id": 27,
        "name": "진미식당",
        "lat": 37.545293,
        "lng": 126.953118,
        "media": "성시경|먹을텐데",
        "description": "비싸지만 돈 아깝지 않은 인생 간장게장입니다. 꽉 찬 알과 살, 짜지 않은 비법 간장... 김에 싸서 밥 비벼 먹으면 공깃밥 추가는 기본이에요. 예약 필수입니다.",
        "address": "서울 마포구 마포대로 186-6",
        "phone": "02-3211-4468",
        "naver_url": "https://map.naver.com/p/entry/place/11636277",
        "google_maps_url": "https://maps.app.goo.gl/7naqyaoqo3iFLMyk9",
        "category": "한식, 간장게장, 해물",
        "representMenu": "간장게장",
        "addressProvince": "서울"
    },
    {
        "id": 28,
        "name": "어머니대성집",
        "lat": 37.577626,
        "lng": 127.031940,
        "media": "성시경|먹을텐데",
        "description": "잘게 다진 고기가 부드럽게 넘어가고 국물이 맑으면서도 깊습니다. 육회비빔밥과 함께 먹는 조합을 강력 추천합니다.",
        "address": "서울 동대문구 왕산로11길 4",
        "phone": "02-923-1718",
        "naver_url": "https://map.naver.com/p/entry/place/11604593",
        "google_maps_url": "https://www.google.com/maps/search/%EC%9어머니대성집+%EC%84%9C%EC%9A%B8+%EB%8F%99%EB%8C%80%EB%AC%B8%EA%B5%AC+%EC%99%91%EC%82%B0%EB%A1%9C11%EA%B8%B8+4",
        "category": "한식, 해장국, 국밥",
        "representMenu": "해장국",
        "addressProvince": "서울"
    },
    {
        "id": 29,
        "name": "을지다방",
        "lat": 37.566120,
        "lng": 126.991834,
        "media": "또간집|을지로편",
        "description": "레트로 그 자체인 곳에서 마시는 쌍화차 한 잔... 노른자 톡 터뜨려 견과류랑 같이 마시면 몸이 따뜻해져요. BTS도 다녀간 곳이라니 더 특별하게 느껴집니다.",
        "address": "서울 중구 충무로 72-1",
        "phone": "02-2272-1886",
        "naver_url": "https://map.naver.com/p/entry/place/11666492",
        "google_maps_url": "https://www.google.com/maps/search/%EC%9D%84%EC%A7%80%EB%8B%A4%0B%ED%92%98+%EC%84%9C%EC%9A%B8+%EC%A4%91%EA%B5%AC+%EC%Bongmu-ro+72-1",
        "category": "기타, 카페, 전통찻집",
        "representMenu": "쌍화차",
        "addressProvince": "서울"
    },
    {
        "id": 20,
        "name": "산까치냉면",
        "lat": 37.541372,
        "lng": 126.945228,
        "media": "또간집|마포편",
        "description": "비빔냉면 양념장이 중독성 있어요. 적당히 맵고 달큰해서 계속 손이 갑니다. 마포 도화동 골목에 숨겨진 진정한 냉면 맛집입니다. 육수 한 컵 곁들이면 최고예요.",
        "address": "서울 마포구 도화길 35",
        "phone": "02-711-1182",
        "naver_url": "https://map.naver.com/p/entry/place/11680183",
        "google_maps_url": "https://www.google.com/maps/search/%EC%82%B0%EA%B9%8C%EC%B9%98%EB%83%89%EB%A9%B4+%EC%84%9C%EC%9A%B8+%EB%A7%88%ED%8F%AC%EA%B5%AC+%EB%8F%84%ED%99%94%EA%B8%B8+35",
        "category": "한식, 냉면, 국수",
        "representMenu": "비빔냉면",
        "addressProvince": "서울"
    }
];
