
import { YouTubeCollector } from '../src/lib/v3/engine/YouTubeCollector';
import { CONFIG } from '../src/lib/v3/engine/config';

// Mock Config for context (though not used directly in extractCandidates currently)
console.log("🧪 Testing Extraction Logic 🧪");

const collector = new YouTubeCollector();

const TEST_CASES = [
    // 1. Holy Grail Case (Sung Si-kyung)
    "성시경의 먹을텐데 l 서울 논현동 홍명 l 탕수육, 간짜장, 짬뽕, 군만두",
    "성시경의 먹을텐데 l 이태원 매덕스피자",

    // 2. Tzuyang Case (Generic)
    "라면 20봉지 먹방. 리얼사운드",
    "시장 떡볶이 3판 다 먹었습니다.",

    // 3. Difficult Case
    "[또간집] 풍자 강남역 맛집 뚫었습니다", // Brackets
    "줄서는식당2 | 입짧은햇님 극찬한 그집", // Pipe
    "성시경의 먹을텐데 l 전주 태평집 (feat. 소바, 콩국수)", // With parens
];

TEST_CASES.forEach((title, idx) => {
    console.log(`\n[Case ${idx + 1}] Title: "${title}"`);
    const results = collector.extractCandidates(title);

    if (results.length > 0) {
        results.forEach(res => {
            console.log(`  ✅ Extracted -> Name: [${res.name}], Area: [${res.area || 'N/A'}]`);
        });
    } else {
        console.log(`  ❌ Failed to extract.`);
    }
});
