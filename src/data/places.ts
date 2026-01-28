// 세부 카테고리를 상위 카테고리로 매칭하는 맵
export const CATEGORY_MAP: Record<string, string[]> = {
    '한식': ['한식', '냉면', '불고기', '비빔밥', '찜', '탕', '찌개', '고기', '곱창', '막창', '해장국', '국밥', '백반', '정식', '족발', '보쌈', '삼겹살', '고깃집'],
    '중식': ['중식', '중국집', '짜장면', '짬뽕', '마라탕', '양꼬치', '딤섬'],
    '일식': ['일식', '초밥', '스시', '돈가스', '우동', '라멘', '이자카야', '회', '횟집', '소바'],
    '양식': ['양식', '이탈리안', '프렌치', '스테이크', '파스타', '피자', '햄버거', '레스토랑'],
    '분식': ['분식', '떡볶이', '김밥', '라면'],
    '기타': ['카페', '디저트', '베이커리', '술집', '포차', '치킨', '패스트푸드', '동남아', '베트남', '태국', '인도', '멕시칸']
};

/**
 * 특정 장소의 세부 카테고리가 선택된 상위 카테고리 필터에 포함되는지 확인
 */
export const checkCategoryMatch = (placeCategory: string | undefined, filterCategories: string[]) => {
    if (filterCategories.length === 0) return true;
    if (!placeCategory) return filterCategories.includes('기타');

    return filterCategories.some(filterCat => {
        // 1. 직접 일치 (예: '한식' === '한식')
        if (placeCategory === filterCat) return true;

        // 2. 매핑 리스트에 포함되는지 확인 (예: '냉면'이 '한식' 리스트에 있는지)
        const subCats = CATEGORY_MAP[filterCat];
        if (subCats && subCats.some(sub => placeCategory.includes(sub))) return true;

        return false;
    });
};

export interface Place {
    id: number;
    name: string;
    lat: number;
    lng: number;
    media: string;
    description: string;
    address: string;
    phone: string;
    image_url: string;
    naver_url: string;
    category?: string;
    addressProvince?: string;
    addressCity?: string;
    addressDistrict?: string;
}

// places.json 데이터 기반으로 DUMMY_PLACES 복구 (Top 10)
export const DUMMY_PLACES: Place[] = [
    {
        "id": 1,
        "name": "남포면옥",
        "lat": 37.5671652991647,
        "lng": 126.981753597164,
        "media": "성시경 SUNG SI KYUNG",
        "description": "벽면에 가득한 유명 인사들의 사인만 봐도 이 집이 얼마나 오랫동안 사랑받아왔는지 느껴집니다. 화려하진 않지만 차분하고 단정한 분위기라 어른들 모시고 오기에도, 조용한 식사 자리로도 좋습니다. 자극적인 음식보다 담백한 한식을 좋아하시는 분 추천합니다.",
        "address": "서울 중구 다동 121-4",
        "phone": "02-777-3131",
        "image_url": "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=AcnlKN0qOZILHnddn5834O82PBevD9urxOqwjchREIJTKUDcLmMDlMDaXZozkEaRRsE_VZJP0LmBC_TqoJZwu4NMkgBP8EqOXizxYnOz8dIktJeFqYg0q09lpuyQORDkouEDtY4i4rKMr_OU-ZGLwxwtnGVatSdgop_COJXB_S5rjmtR7Bf0x8fZb53DGQ74YmI0DFTMNAHxChI-THp6jrrPl7m9iZV19NbWlHWccWDHjgYjMvoc2IEd1F8H4TS3HRnXg_keLKy7SpYcxhApstnNUjmzMZ1uvogGuhJbIYtC2L3ZC1gZsMFRC8gLL_Eut3cMSy9ve9QXXyBfi9BT6Xo0_OZJrZHFSYa42zccJoKDkoi1Uib13Ok2g6s1_0W4gdOtvlB1-umfcGrQCoI6yK4SfzN1Li6TkRuY2xtPwlqadfhUYQ&key=AIzaSyB7RjGsNNcEW-HlPlzfg8KpmvHQ9pkCaS0",
        "category": "냉면",
        "addressProvince": "서울",
        "addressCity": "중구",
        "addressDistrict": "다동",
        "naver_url": ""
    },
    {
        "id": 2,
        "name": "산까치냉면",
        "lat": 37.541416219888696,
        "lng": 126.94953414407992,
        "media": "쯔양",
        "description": "진짜 가성비라고 올라오는 데 봐도 음.. 그렇구나 할 때도 있는데 이번 건 진짜 누가 봐도 가성비네요... 와아.... 맛있겠다",
        "address": "서울 마포구 도화동 179-1",
        "phone": "010-3376-2503",
        "image_url": "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=AcnlKN1cnWY3v4orrZpeI5hwzwBH-2YPR-6nCvctfKXjepXPD6HBJqNucbFPiBCjcqjGYXS7AHACjFB_xHhBJ7fsoNcS5s6MEr69MR500jAJV_TkbkRyhJQpuzBk9TX5NGdZuChFQmfAzblOtBA0pPnbAhKShn1kmacaY1yw0Q9fR8mLX2_20KACDKVJyCOHxhbhKe5ql5IhkeSvqw6ROsZ9XaCKc54RK1CLD9ile_5ANOhXThKgY_-EJwj1ja0jO8M_EbU-8JNAa0ibkWohLzpDwblH4ypfd3ZJlXL6QTZrw1Cz9w&key=AIzaSyB7RjGsNNcEW-HlPlzfg8KpmvHQ9pkCaS0",
        "category": "냉면",
        "addressProvince": "서울",
        "addressCity": "마포구",
        "addressDistrict": "도화동",
        "naver_url": ""
    },
    {
        "id": 3,
        "name": "진미평양냉면 별관",
        "lat": 37.5161357904841,
        "lng": 127.036047158128,
        "media": "성시경 SUNG SI KYUNG",
        "description": "물냉면은 육향이 꽤 진한 편으로, 지금까지 먹어본 평양냉면 중 간이 가장 센 축에 속한다. 전반적으로는 잘 먹은 평양냉면. 줄만 길지 않다면 다시 찾고 싶을 것 같다.",
        "address": "서울 강남구 논현동 115-10",
        "phone": "02-515-3469",
        "image_url": "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=AcnlKN2IkJ3-9stlq_t3gDYxPHH1kjkKE7xP6N4yhNpXIS8ckms3bGku8SNduHVFfek4BEno7iF8e6v7OWV4qWleNCajtxAYj4NgJYkNh4YuBpq2W2e5jb9pgrCfR2lZVg4LE_ZShRxc22ulxDyVOP_Rpnajgzs5ZzBAT3r575RgxViPOs3uXGCCZrQh7sYFNWQFH9v89xxWMiwdkQAVFBs_WQPrHqw76X5FUeSjMEff4Im1xN9R9y-VwL2gxSpnyGF7mTphI1nxDL72_oQe3d0frgf6m2BO1V0lohIokTlcLfR7cXZZAxwaox4uFCecJSSRcBYlU_fFF5qrmBb5oC1AYV7lQaAHBTM-d50toLFqqhn4W7ypOuJxFSC6AcO_rvTcP7gh1fbpSmapVaGIXWYBeLLdTe7jjGodLERfbY-OuJHLCw&key=AIzaSyB7RjGsNNcEW-HlPlzfg8KpmvHQ9pkCaS0",
        "category": "냉면",
        "addressProvince": "서울",
        "addressCity": "강남구",
        "addressDistrict": "논현동",
        "naver_url": ""
    },
    {
        "id": 4,
        "name": "고향식당",
        "lat": 37.4794812383882,
        "lng": 126.928678059615,
        "media": "쯔양",
        "description": "신원동에서 제일 반찬 다양합니다 가격도 저렴합니다",
        "address": "서울 관악구 신림동 1635-85",
        "phone": "",
        "image_url": "",
        "category": "한식",
        "naver_url": ""
    },
    {
        "id": 5,
        "name": "갯마을횟집",
        "lat": 37.567527412091295,
        "lng": 126.84245993659616,
        "media": "쯔양",
        "description": "코스도 가격대비 괜찮습니다!",
        "address": "서울 강서구 등촌동 753",
        "phone": "02-3662-5112",
        "image_url": "",
        "category": "회",
        "naver_url": ""
    },
    {
        "id": 6,
        "name": "최가네황소곱창",
        "lat": 37.57012181541133,
        "lng": 126.99386480069762,
        "media": "또간집",
        "description": "한우소곱창 전문 종로3가 골목맛집",
        "address": "서울 종로구 종로3가 158",
        "phone": "02-2274-6683",
        "image_url": "",
        "category": "곱창,막창",
        "naver_url": ""
    }
];
