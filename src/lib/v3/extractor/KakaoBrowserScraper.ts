
import * as puppeteer from 'puppeteer';
import { Browser, Page } from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';

// Node 18+ includes fetch natively. If older, one might need 'undici' or 'node-fetch'.
// import { fetch } from "undici"; 

export class KakaoBrowserScraper {
    private browser: Browser | null = null;
    private page: Page | null = null;

    constructor() {
        // LM Studio local server (OpenAI-compatible)
        // no api key needed by default for local server
    }

    async init() {
        if (!this.browser) {
            console.log("[KakaoBrowserScraper] 🚀 수집 전용 브라우저를 초기화합니다...");
            const userDataDir = path.join(process.cwd(), '.puppeteer_data');

            try {
                console.log("[Debug] Launching Puppeteer...");
                this.browser = await puppeteer.launch({
                    headless: false,
                    defaultViewport: null,
                    userDataDir: userDataDir,
                    args: [
                        '--start-maximized',
                        '--window-size=1920,1080',
                        '--disable-blink-features=AutomationControlled',
                        '--no-sandbox',
                        '--disable-infobars',
                        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    ]
                });
                console.log("[Debug] Puppeteer Launched.");

                const pages = await this.browser.pages();
                this.page = pages[0];
                console.log("[Debug] Got Page. Setting webdriver property...");

                await this.page.evaluateOnNewDocument(() => {
                    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                });

                console.log("[KakaoBrowserScraper] 🌐 카카오 지도로 접속 중...");
                await this.page!.goto('https://map.kakao.com', { waitUntil: 'domcontentloaded' }).catch((e) => console.log("Goto Error:", e));
                console.log("[Debug] Page Loaded. Initializing Readline...");

                const readline = (await import('readline')).createInterface({
                    input: process.stdin,
                    output: process.stdout
                });

                console.log("[Debug] Readline Interface Created. Asking Question...");

                await new Promise(resolve => {
                    readline.question('[KakaoBrowserScraper] 🏁 로그인이 완료되었나요? (엔터를 누르면 수집 시작): ', () => {
                        console.log("[Debug] Readline Answer Received.");
                        readline.close();
                        resolve(true);
                    });
                });
                console.log("[Debug] Init Completed.");

            } catch (err: any) {
                console.error("[Debug] Init Error Catch:", err);
                throw new Error(`브라우저 실행 실패: ${err.message}`);
            }
        }
    }

    private async callLmStudioVision(imageBase64: string): Promise<any> {
        const endpoint = "http://127.0.0.1:1234/v1/chat/completions";
        const model = "qwen2.5-vl-7b-instruct";

        // 토큰 최소화 프롬프트 (JSON ONLY 강제) + 카테고리 정의 상세화
        const prompt =
            `Extract store info from Kakao Map place page screenshot.
      Return ONLY JSON with keys:
      name, category, address_raw, address_geocode, phone, menus(3).
      
      Category Definitions (Strictly Choose One):
      - 한식: Korean food, Kimchi, Stew(Jjigae), Bibimbap, Pork Belly (Samgyeopsal). Keyword: "찌개" -> 한식
      - 중식: Chinese food, Jajangmyeon, Jjamppong, Tangsuyuk, Mala
      - 일식: Japanese food, Sushi, Sashimi, Tonkatsu, Ramen, Udon, Omakase, Tuna, Raw Fish
      - 양식: Western food, Steak, Pasta, Pizza, Burger, Salad. Keywords: "스테이크", "피자", "샐러드", "파스타" -> 양식
      - 분식: Korean Snack, Tteokbokki, Gimbap, Ramyeon, Sundae. Keyword: "떡볶이" -> 분식
      - 기타: Cafe, Coffee, Bakery, Dessert, Bar, Pub, Alcohol only. Keywords: "빵", "커피", "카페", "디저트" -> 기타
      
      Phone Number Guidelines:
      - Valid formats: 02-xxxx-xxxx, 010-xxxx-xxxx, 031-xxx-xxxx
      - Safe numbers (4-digit prefix): 0507-xxxx-xxxx, 0503-xxxx-xxxx, 050x-xxxx-xxxx are VALID.
      - Do NOT extract Zip codes (e.g., (04527)) or distances (e.g., 167m) as phone numbers.

      menus: try for exactly 3 distinct items (if fewer exist, return fewer).`;

        const body = {
            model,
            temperature: 0,
            max_tokens: 300,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: { url: `data:image/png;base64,${imageBase64}` }
                        }
                    ]
                }
            ]
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
                signal: controller.signal
            });

            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(`LM Studio HTTP ${res.status}: ${t}`);
            }

            const json = await res.json();

            const content: string =
                json?.choices?.[0]?.message?.content ??
                "";

            // code fence 제거 + JSON만 최대한 추출
            const cleaned = content
                .replace(/```json/gi, "")
                .replace(/```/g, "")
                .trim();

            // 혹시 앞뒤로 텍스트 섞이면 JSON 블록만 잡기
            const firstBrace = cleaned.indexOf("{");
            const lastBrace = cleaned.lastIndexOf("}");
            const jsonOnly =
                firstBrace >= 0 && lastBrace > firstBrace
                    ? cleaned.slice(firstBrace, lastBrace + 1)
                    : cleaned;

            return JSON.parse(jsonOnly);
        } finally {
            clearTimeout(timeout);
        }
    }

    async getPlaceDetails(placeId: string): Promise<any | null> {
        if (!this.browser || !this.page) await this.init();

        try {
            const url = `https://place.map.kakao.com/${placeId}`;
            console.log(`\n[AI Full Scan] 👁️ 업체 정보를 심층 분석합니다: ${url}`);

            await this.page!.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

            // [AI 수집 버튼] - 시각적 피드백용
            await this.page!.evaluate(() => {
                document.getElementById('scrap-trigger-btn')?.remove();
                const btn = document.createElement('button');
                btn.id = 'scrap-trigger-btn';
                btn.innerHTML = '🤖 AI 분석 시작 (클릭)';
                btn.style.cssText = `
                    position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
                    z-index: 2147483647; padding: 20px 40px; background-color: #4285F4; color: #fff;
                    border: 5px solid #fff; border-radius: 20px; font-weight: 800; font-size: 20px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.6); transition: all 0.3s; cursor: pointer;
                `;
                btn.onclick = () => { (window as any).SCRAP_READY = true; btn.style.display = 'none'; };
                document.body.appendChild(btn);
            });

            // 사용자 클릭 대기
            console.log(`[KakaoBrowserScraper] ⏳ 사용자 클릭 대기 중...`);
            await this.page!.waitForFunction(() => (window as any).SCRAP_READY === true, { timeout: 0 });

            console.log(`[LM Studio Vision] 📸 화면 캡처 및 AI 분석 시작...`);

            // 1. [스크린샷] AI 분석(OCR/Text)을 위한 화면 캡처 (저장 안함)
            let infoBase64 = "";

            try {
                // 오직 텍스트 분석용으로만 메모리에 캡처
                const fullBuf = await this.page!.screenshot({ encoding: 'binary' });
                const image = sharp(fullBuf);
                const metadata = await image.metadata();

                if (metadata.width && metadata.height) {
                    // AI 인식률을 위해 중앙 35% 영역만 크롭 (분석 정확도 향상용)
                    // [MOD] 2024-01-31: 사용자 요청으로 50% -> 35%로 축소
                    const extractWidth = Math.floor(metadata.width * 0.35);
                    const left = Math.floor(metadata.width * 0.325); // (1 - 0.35) / 2 = 0.325

                    const sideCroppedBuf = await image
                        .extract({ left, top: 0, width: extractWidth, height: metadata.height })
                        .toBuffer();

                    infoBase64 = sideCroppedBuf.toString('base64');
                    console.log(`[KakaoBrowserScraper] 📸 AI 분석용 스크린샷 캡처 완료 (저장하지 않음)`);
                }
            } catch (err: any) {
                console.error(`[KakaoBrowserScraper] 🚨 스크린샷 캡처 에러:`, err.message);
                return null;
            }

            // 2. [AI 분석] 메뉴 및 업체명 추출 (Local LM Studio)
            let aiData: any = {};
            try {
                aiData = await this.callLmStudioVision(infoBase64);
                console.log(`[LM Studio Vision] 🤖`, aiData?.name, aiData?.category, aiData?.menus);
            } catch (e: any) {
                console.error("[LM Studio Vision] Error:", e?.message || e);
                aiData = {}; // fallback
            }

            // 3. [Step 3: Vantage Image]
            // 사용자 강력 요청: 업체 이미지 수집 완전 중단 (유튜브 썸네일 사용)
            // NO_OP

            // 4. [데이터 반환]
            const addressCleaner = (val: any) => {
                const s = String(val || "");
                if (!s || s === "undefined" || s === "null") return "";

                let clean = s.replace(/\(\우\)\d{5}/g, '').replace(/복사/g, '').replace(/지번|우편번호/g, '').replace(/\s+/g, ' ').trim();
                // [NEW] 층수(1층, 지하 1층, B1층 등) 이후 텍스트 제거 로직
                const floorMatch = clean.match(/(지하\s*\d+층|\d+층|B\d+층)/);
                if (floorMatch && floorMatch.index !== undefined) {
                    clean = clean.substring(0, floorMatch.index + floorMatch[0].length);
                }
                return clean;
            };

            const phoneCleaner = (val: any) => {
                const s = String(val || "").trim();
                // 1. 0으로 시작하고, 숫자와 하이픈만 있어야 하며, 길이가 최소 9자 이상
                // 2. 050 안심번호(4자리 국번) 포함
                // 정규식: ^0\d{1,3}-?\d{3,4}-?\d{4}$
                // 예: 02-123-4567, 010-1234-5678, 0507-1234-5678
                if (!/^0\d{1,3}-?\d{3,4}-?\d{4}$/.test(s)) {
                    // 전화번호 형식이 아니면(우편번호, 일반 텍스트 등) 빈 문자열 반환
                    return "";
                }
                return s;
            }

            const cleanAddress = addressCleaner(aiData.address_raw);
            const cleanGeocode = addressCleaner(aiData.address_geocode || aiData.address_raw);
            const cleanPhone = phoneCleaner(aiData.phone);

            // 이미지 실패 시 기본 빈 값이나 placeholder 고려 가능 (현재는 그냥 파일 생성 안됨)
            // 만약 파일이 없으면 프론트엔드에서 처리가 필요할 수 있음.
            // 여기서는 성공 여부와 상관없이 Path 반환 (파일 존재 여부는 나중 문제)

            const validCategories = ['한식', '중식', '일식', '양식', '분식'];
            let category = (aiData.category || "기타").trim();
            if (!validCategories.includes(category) && category !== '기타') {
                console.log(`[Category Fix] AI returned '${category}', mapping to '기타'`);
                category = '기타';
            }

            const finalCategory = { fullname: category };
            console.log(`[KakaoBrowserScraper] DEBUG: Returning category object:`, finalCategory);

            return {
                basicInfo: {
                    placenamefull: aiData.name,
                    address: {
                        addressname: {
                            fullAddress: cleanAddress,
                            geocodeAddress: cleanGeocode
                        }
                    },
                    category: finalCategory,
                    wgs84: { lat: 0, lon: 0 },
                    menu_items: aiData.menus || [],
                    phonenum: cleanPhone
                },
                photo: {
                    selectedPhoto: {
                        orgurl: "" // Ingester will allow this to degrade to YouTube Thumbnail
                    }
                }
            };

        } catch (error: any) {
            console.error(`🚨 Fatal Error:`, error);
            return null;
        }
    }
    async close() {
        if (this.browser) { await this.browser.close(); this.browser = null; this.page = null; }
    }
}
