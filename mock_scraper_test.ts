
import { KakaoScraper } from './src/lib/v3/extractor/KakaoScraper';

const scraper = new KakaoScraper();

// KakaoBrowserScraper가 반환하는 형태 모의 (Mock)
const mockAiReturn = {
    basicInfo: {
        placenamefull: "테스트 식당",
        address: {
            addressname: {
                fullAddress: "서울 강남구 역삼동",
                geocodeAddress: "서울 강남구 역삼동"
            }
        },
        // 문제의 구간: category 구조
        category: { fullname: "한식" },
        wgs84: { lat: 0, lon: 0 },
        menu_items: ["김치찌개", "된장찌개"],
        phonenum: "02-123-4567"
    },
    photo: {
        selectedPhoto: { orgurl: "http://example.com/img.jpg" }
    }
};

console.log("Testing parseKakaoData with mock data...");
console.log("Mock Input Category:", mockAiReturn.basicInfo.category);

try {
    const result = scraper.parseKakaoData("dummy-id", mockAiReturn);
    console.log("---------------------------------------------------");
    console.log("Parsing Result Category:", `"${result.category}"`);
    console.log("---------------------------------------------------");

    if (result.category === "한식") {
        console.log("✅ SUCCESS: Category preserved.");
    } else {
        console.error("❌ FAILURE: Category lost or mismatched.");
    }
} catch (e) {
    console.error("❌ ERROR during parse:", e);
}
