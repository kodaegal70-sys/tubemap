/**
 * VideoFilter.ts
 * Implements the "TubeMap Video Pre-Filter Expansion" logic (v2.0: Scoring System).
 * Filters videos based on a scoring threshold (50 points).
 */
import { CONFIG } from './config';

export interface VideoMetadata {
    title: string;
    description: string;
    channelTitle: string;
    tags?: string[];
}

export class VideoFilter {

    // Condition 1: Food Related Keywords (Score +25)
    private static FOOD_KEYWORDS = [
        "맛집", "식당", "가게", "음식", "메뉴",
        "restaurant", "food", "eat",
        "고기", "구이", "삼겹살", "갈비", "곱창", "막창",
        "국밥", "찌개", "탕", "전골",
        "면", "국수", "라멘", "우동", "짜장", "짬뽕", "파스타",
        "회", "초밥", "스시", "돈가스", "카츠",
        "빵", "디저트", "카페", "커피",
        "술집", "포차", "이자카야", "펍", "와인",
        "분식", "떡볶이", "김밥", "순대", "튀김",
        "한식", "중식", "일식", "양식",
        "먹방", "mukbang"
    ];

    // Condition 2: Visit/Action Keywords (Score +25)
    private static VISIT_KEYWORDS = [
        "방문", "웨이팅", "줄서서", "사장님", "주문",
        "포장", "매장", "다녀왔습니다", "먹어봤습니다", "가봤습니다",
        "리뷰", "후기", "탐방", "브이로그",
        "review", "vlog", "visit",
        // New Context Keywords (User Request)
        "손님", "도전먹방", "다먹으면", "성공", "실패"
    ];

    // Condition 3: Region Keywords (Score +30)
    private static REGION_KEYWORDS = [
        "서울", "강남", "홍대", "성수", "종로",
        "잠실", "부산", "대구", "대전", "광주",
        "수원", "인천", "판교", "일산", "분당",
        "제주", "속초", "여수", "경주", "전주", "춘천",
        "북촌", "서촌", "이태원", "한남", "압구정"
    ];

    // Pattern: Region Suffixes (Score +30 if matches)
    private static PLACE_PATTERNS = [
        /(.+)(식당|집|본점|가게)/,
        /(.+)(점)/,
        /(동|구|로)$/ // e.g. "역삼동", "강남구"
    ];

    // Skip Conditions (Immediate Discard)
    private static SKIP_KEYWORDS = [
        "음성변조", "No Talking",
        "레시피", "만들기", "cooking", "recipe", "how to", "make",
        "집밥", "반찬", "김치", "청소", "cleaning",
        "밀키트", "택배", "집에서", "따라하기",
        "편의점", "마트"
    ];

    /**
     * Evaluates if a video is a valid candidate for processing.
     * Strategy v2.0: Scoring System
     * Threshold: 50 points
     */
    static shouldProcess(video: VideoMetadata): { valid: boolean, reason?: string, score?: number } {
        // Ensure description is a string
        const safeDesc = video.description || "";
        const fullText = `${video.title} ${safeDesc}`.toLowerCase();
        const title = video.title.toLowerCase();

        // 1. Check Skip Conditions (Absolute Veto)
        for (const skip of this.SKIP_KEYWORDS) {
            if (title.includes(skip.toLowerCase())) {
                console.log(`[VideoFilter] REJECT (Skip): ${skip} found in title.`);
                return { valid: false, reason: `SKIP_KEYWORD: ${skip}` };
            }
        }

        let score = 0;
        const details: string[] = [];

        // 2. Score Calculation

        // A. Region (+30)
        // Check both fixed list AND regex patterns like "OOO동", "OOO구"
        const hasRegionKeyword = this.REGION_KEYWORDS.some(k => fullText.includes(k));
        const hasRegionPattern = this.PLACE_PATTERNS[2].test(title); // (동|구|로)$

        if (hasRegionKeyword || hasRegionPattern) {
            score += 30;
            details.push("Region(+30)");
        }

        // B. Food (+25)
        const hasFood = this.FOOD_KEYWORDS.some(k => fullText.includes(k.toLowerCase()));
        if (hasFood) {
            score += 25;
            details.push("Food(+25)");
        }

        // C. Visit/Action (+25)
        const hasVisit = this.VISIT_KEYWORDS.some(k => fullText.includes(k.toLowerCase()));
        if (hasVisit) {
            score += 25;
            details.push("Visit(+25)");
        }

        console.log(`[VideoFilter] Score: ${score} [${details.join(', ')}] | Title: "${video.title.substring(0, 40)}..."`);

        // 3. Threshold Check
        // Need at least 50 points.
        // Combinations:
        // - Region(30) + Food(20) = 50 (PASS) -> "Kangnam Pasta"
        // - Region(30) + Visit(20) = 50 (PASS) -> "Kangnam Review"
        // - Food(20) + Visit(20) = 40 (FAIL) -> "Pasta Review" (Target too vague? Actually maybe valid but speculative)
        // Let's stick to 50 for now as "Store Visit" implies location is important or at least food + visit context is very strong.
        // Ideally we want Region to be identified.

        if (score >= 50) {
            return { valid: true, score };
        } else {
            return { valid: false, reason: `LOW_SCORE: ${score} (Needed 50)`, score };
        }
    }
}
