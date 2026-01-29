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
        '먹을텐데', '또간집', '노포', '술집', '고기', '국밥', '면', '요리', 'cooking',
        '방문', '웨이팅', '줄서서', '사장님', '주문', '포장', '매장', '다녀왔습니다', '먹어봤습니다'
    ],
    MIN_KEYWORDS_MATCH: 1, // [Modified] 2 is too strict for titles like "Eogleutende", lowering to 1 for now.

    // Step 2 Exclusion (Strict "No Fake Data")
    VIDEO_TITLE_EXCLUSIONS: [
        '레시피', '만들기', 'cooking', 'recipe', 'how to', 'make',
        '집밥', '반찬', '김치', '청소', 'cleaning',
        '리얼사운드',
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

    // FIXED SEED CHANNEL LIST (MVP TEST)
    YOUTUBE_CHANNELS: [
        "성시경 SUNG SI KYUNG",
        "스튜디오 수제", // 또간집
        "라꼰즈", "Rakkonz",
        "TVCHOSUN - TV조선",
        "백종원 PAIK JONG WON",
        "또간집",
        "최자로드",
        "백반기행 공식",
        "줄 서는 식당 공식",
        "맛상무",
        "푸드헌터K",
        "서울리안",
        "미식로드",
        "맛도리TV",
        "푸드트래블",
        "먹킷리스트"
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
