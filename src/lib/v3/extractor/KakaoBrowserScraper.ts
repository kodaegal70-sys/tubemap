import { GoogleGenerativeAI } from "@google/generative-ai";
import * as puppeteer from 'puppeteer';
import { Browser, Page } from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';

export class KakaoBrowserScraper {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private genAI: GoogleGenerativeAI;

    constructor() {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.YOUTUBE_API_KEY;
        if (!apiKey) throw new Error("GOOGLE_API_KEY is missing via NEXT_PUBLIC_GOOGLE_API_KEY or YOUTUBE_API_KEY");
        this.genAI = new GoogleGenerativeAI(apiKey);
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

            console.log(`[Gemini Vision] 📸 화면 캡처 및 AI 분석 시작...`);

            // 1. [스크린샷] AI 분석(OCR/Text)을 위한 화면 캡처 (저장 안함)
            let infoBase64 = "";

            try {
                // 오직 텍스트 분석용으로만 메모리에 캡처
                const fullBuf = await this.page!.screenshot({ encoding: 'binary' });
                const image = sharp(fullBuf);
                const metadata = await image.metadata();

                if (metadata.width && metadata.height) {
                    // AI 인식률을 위해 중앙 50% 영역만 크롭 (분석 정확도 향상용)
                    const extractWidth = Math.floor(metadata.width * 0.5);
                    const left = Math.floor(metadata.width * 0.25);

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

            // 2. [AI 분석] 메뉴 및 업체명 추출
            const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `
                Analyze the provided image from a Kakao Map place detail page.
                Extract store name, address, phone, and menus.
                
                **IMPORTANT**: You MUST try hard to extract exactly 3 distinct menu items.
                Look closely at the menu list or food descriptions. 
                Do not stop at 1 or 2 items unless the image absolutely lists fewer than 3 items total.
                
                Return STRICTLY as a JSON object:
                {
                    "name": "Store Name",
                    "address_raw": "Full Address",
                    "address_geocode": "Cleaned address for geocoding",
                    "phone": "Phone Number",
                    "menus": ["Item 1", "Item 2", "Item 3"]
                }
            `;

            const result = await model.generateContent([
                { text: prompt },
                { inlineData: { data: infoBase64, mimeType: "image/png" } }
            ]);
            const responseText = await result.response.text();
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            let aiData;
            try {
                aiData = JSON.parse(cleanJson);
                console.log(`[KakaoBrowserScraper] 🤖 AI Analysis Result:`, aiData.name, aiData.menus);
            } catch (e) {
                console.error("AI Parse Error:", e);
                aiData = {};
            }

            // 3. [Step 3: Vantage Image]
            // 사용자 강력 요청: 업체 이미지 수집 완전 중단 (유튜브 썸네일 사용)
            // NO_OP

            // 4. [데이터 반환]
            const addressCleaner = (s: string) => {
                if (!s) return "";
                let clean = s.replace(/\(\우\)\d{5}/g, '').replace(/복사/g, '').replace(/지번|우편번호/g, '').replace(/\s+/g, ' ').trim();
                // [NEW] 층수(1층, 지하 1층, B1층 등) 이후 텍스트 제거 로직
                const floorMatch = clean.match(/(지하\s*\d+층|\d+층|B\d+층)/);
                if (floorMatch && floorMatch.index !== undefined) {
                    clean = clean.substring(0, floorMatch.index + floorMatch[0].length);
                }
                return clean;
            };
            const cleanAddress = addressCleaner(aiData.address_raw);
            const cleanGeocode = addressCleaner(aiData.address_geocode);

            // 이미지 실패 시 기본 빈 값이나 placeholder 고려 가능 (현재는 그냥 파일 생성 안됨)
            // 만약 파일이 없으면 프론트엔드에서 처리가 필요할 수 있음.
            // 여기서는 성공 여부와 상관없이 Path 반환 (파일 존재 여부는 나중 문제)

            return {
                basicInfo: {
                    placenamefull: aiData.name,
                    address: {
                        addressname: {
                            fullAddress: cleanAddress,
                            geocodeAddress: cleanGeocode
                        }
                    },
                    category: { fullname: "" },
                    wgs84: { lat: 0, lon: 0 },
                    menu_items: aiData.menus || [],
                    phonenum: aiData.phone || ""
                },
                photo: {
                    selectedPhoto: {
                        orgurl: "" // Ingester will allow this to degrade to YouTube Thumbnail
                    }
                }
            };

        } catch (error: any) {
            console.error(`🚨 Fatal Error:`, error);
            if (error.message?.includes("403") || error.message?.includes("PERMISSION_DENIED")) {
                console.error("⚠️ [Tip] 해당 API Key에 'Generative Language API' 권한이 없거나, AI Studio Key가 아닙니다.");
            }
            return null;
        }
    }
    async close() {
        if (this.browser) { await this.browser.close(); this.browser = null; this.page = null; }
    }
}
