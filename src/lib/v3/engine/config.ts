/**
 * TubeMap Engine v1.6 Configuration
 * "No Fake Data" Policy Enforced.
 */
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables locally if not already loaded
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

export const CONFIG = {
    API_KEYS: {
        YOUTUBE: process.env.YOUTUBE_API_KEY || '',
        KAKAO: process.env.KAKAO_LOCAL_API_KEY || ''
    },

    // Step 1 Filtering
    SEARCH_REQUIRED_KEYWORDS: [
        '맛집', '먹방', 'mukbang', 'food', 'restaurant', '리뷰', '식당',
        '먹을텐데', '또간집', '노포', '술집', '고기', '국밥', '면', '요리', 'cooking'
    ],
    MIN_KEYWORDS_MATCH: 1, // [Modified] 2 is too strict for titles like "Eogleutende", lowering to 1 for now.

    // Step 2 Exclusion (Strict "No Fake Data")
    VIDEO_TITLE_EXCLUSIONS: [
        '레시피', '만들기', 'cooking', 'recipe', 'how to', 'make',
        '집밥', '반찬', '김치', '청소', 'cleaning', 'vlog', '브이로그',
        '먹방 ASMR', '리얼사운드',
        '밀키트', '택배', '포장', '집에서', '따라하기' // Meal kits and home cooking
    ],

    // Targets
    BROADCAST_PROGRAMS: [
        "2TV 생생정보", "생활의 달인", "생방송 투데이", "생방송 오늘N", "식객 허영만의 백반기행",
        "줄 서는 식당", "토요일은 밥이 좋아", "맛있는 녀석들", "전지적 참견 시점", "나 혼자 산다",
        "모닝와이드", "굿모닝 대한민국 라이브", "생방송 전국시대", "서민갑부", "맛남의 광장",
        "백종원의 골목식당", "빅데이터 랭킹맛집", "한국인의 밥상", "생생정보마당", "휴먼다큐 사노라면",
        "알콩달콩", "건강한 집"
    ],

    YOUTUBE_CHANNELS: [
        "쯔양", "도나", "제인 ASMR", "홍유 ASMR", "후바", "쏘영", "햄지", "문복희", "공삼테이블",
        "설기양", "히밥", "시오 ASMR", "트윈루지", "떵개", "상해기", "히밥TV", "입짧은햇님", "밴쯔",
        "야미보이", "성시경", "백종원의 요리비책", "만개의레시피", "영국남자", "곽튜브", "최자로드",
        "또간집", "풍자테레비", "승우아빠", "김사원세끼", "애주가 참피디", "취요남", "회사원A 푸드",
        "홍사운드", "푸디랜드", "리얼마우스", "아미 ASMR", "푸드킹덤", "정육왕", "먹보스 쭈엽이",
        "푸드트래블", "맛상무", "딜리셔스 코리아", "쯔희", "빵먹다살찐떡", "소프 이팅", "요리용디",
        "오분요리", "쿡민석", "백종원 셰프파익", "맛있는 녀석들", "스트리트푸드파이터", "집밥백선생",
        "요리보고 조리보고", "미식가TV", "길거리음식왕", "한국길거리음식", "스트리트푸드코리아",
        "푸드레인저 코리아", "케이푸드 스토리", "푸드헌터", "먹킷리스트", "맛도리TV", "푸드로그",
        "푸드몬", "미식로드", "맛집탐방TV", "요리왕비룡", "요리하는남자", "서울리안", "푸드헌터K",
        "먹방브이로그TV", "푸드챌린지TV", "푸드스토리텔러", "케이푸드연구소", "홈쿡마스터", "쿡앤잇",
        "맛집헌터TV", "푸드파이터K", "먹방스타TV", "푸드월드코리아", "미식채널", "요리하는언니",
        "쿡스타그램TV", "푸드인플루언서TV", "맛집가이드TV", "푸드마스터TV", "코리안푸드TV", "미식로그",
        "푸드크리에이터K", "먹방챌린저", "요리사랑", "푸드코리아 공식", "먹방여신", "푸드로드TV",
        "코리안푸드 공식", "푸드마켓TV", "먹방셀럽TV", "푸드타임K", "미식스토리TV", "케이푸드 익스플로러"
    ],

    // Categorization Rules (Must maximize match)
    CATEGORY_KEYWORDS: {
        '한식': ['한식', '냉면', '불고기', '국밥', '고기', '삼겹살', '찌개', '백반', '국수', '칼국수', '곱창', '족발', '보쌈'],
        '중식': ['중식', '짜장면', '짬뽕', '탕수육', '마라탕', '양꼬치', '딤섬'],
        '일식': ['일식', '초밥', '스시', '라멘', '돈가스', '우동', '이자카야', '회'],
        '양식': ['양식', '스테이크', '파스타', '피자', '햄버거', '브런치'],
        '분식': ['분식', '떡볶이', '김밥', '라면', '튀김', '순대'],
        '기타': ['카페', '디저트', '베이커리', '술집', '치킨']
    }
};
