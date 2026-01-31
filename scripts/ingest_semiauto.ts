import * as fs from 'fs';
import * as path from 'path';
import { CuratedCollector } from '../src/lib/v3/engine/CuratedCollector';
import { KakaoBrowserScraper } from '../src/lib/v3/extractor/KakaoBrowserScraper';
import { KakaoScraper } from '../src/lib/v3/extractor/KakaoScraper';

/**
 * [반자동] 비전형 수집 인제스터 (Semi-Auto Vision Ingester)
 */
async function runSemiAutoIngestion() {
    console.log("[ENV] KAKAO_LOCAL_API_KEY=", !!process.env.KAKAO_LOCAL_API_KEY);
    const inputPath = path.join(process.cwd(), 'scripts', 'paste_data.txt');

    if (!fs.existsSync(inputPath)) {
        console.error("❌ paste_data.txt 파일이 없습니다.");
        return;
    }

    const content = fs.readFileSync(inputPath, 'utf-8');
    const lines = content.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith('#'));

    if (lines.length === 0) {
        console.warn("⚠️ 처리할 링크가 없습니다.");
        return;
    }

    console.log(`\n==================================================`);
    console.log(`🎯 반자동 '비전형' 수집 시작 (총 ${lines.length}건)`);
    console.log(`==================================================\n`);

    const collector = new CuratedCollector();
    const browserScraper = new KakaoBrowserScraper();
    const kakaoScraper = new KakaoScraper();

    console.log("[ENV] KAKAO_LOCAL_API_KEY=", !!process.env.KAKAO_LOCAL_API_KEY);

    // 🧹 [종료 관리] 사용자 요청에 따라 창을 자동으로 닫지 않음
    const cleanup = async (exitCode: number = 0) => {
        console.log(`\n[Ingester] 🏁 프로세스를 종료합니다. (수집 창은 수동으로 닫아주세요)`);
        process.exit(exitCode);
    };

    process.on('SIGINT', () => cleanup(0));
    process.on('SIGTERM', () => cleanup(0));
    process.on('uncaughtException', (err) => {
        console.error('\n[Fatal Error]', err);
        cleanup(1);
    });

    try {
        await browserScraper.init();

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const parts = line.split('\t').map(p => p.trim());

            if (parts.length < 2) continue;

            const [youtubeUrl, kakaoUrl] = parts;
            const kakaoId = kakaoScraper.extractPlaceId(kakaoUrl);
            if (!kakaoId) continue;

            console.log(`\n[${i + 1}/${lines.length}] 수집 준비: ${kakaoUrl}`);

            try {
                // 1. 브라우저 비전 스캔 (영역별 캡처 및 텍스트 추출)
                let rawVision = null;
                const backoffDelays = [2000, 5000, 10000, 20000, 40000, 60000];
                const pendingPath = path.join(process.cwd(), 'scripts', 'pending_ai.jsonl');

                for (let retry = 0; retry <= backoffDelays.length; retry++) {
                    try {
                        rawVision = await browserScraper.getPlaceDetails(kakaoId);
                        if (rawVision) break;
                    } catch (err: any) {
                        const is429 = err.message?.includes('429') || (err.response && err.response.status === 429) || err.status === 429;
                        if (is429) {
                            if (retry < backoffDelays.length) {
                                const delay = backoffDelays[retry];
                                console.warn(`\n[Ingester] ⚠️ AI 429 발생. ${delay}ms 후 지수 백오프 재시도... (${retry + 1}/${backoffDelays.length})`);
                                await new Promise(res => setTimeout(res, delay));
                            } else {
                                console.error(`\n[Ingester] ❌ AI 429 최종 실패. pending_ai.jsonl에 기록합니다.`);
                                fs.appendFileSync(pendingPath, JSON.stringify({ youtubeUrl, kakaoUrl, kakaoId, timestamp: new Date().toISOString() }) + '\n');
                                break;
                            }
                        } else {
                            console.error(`⚠️ 비전 분석 에러: ${err.message}`);
                            break;
                        }
                    }
                }

                // 2. 좌표 확보 (REST API 전용 정책)
                let finalCoords: { lat: number | null, lon: number | null } = { lat: null, lon: null };

                // [중요] 사용자의 요청에 따라 오직 카카오 REST API로만 좌표를 100% 확보합니다.
                const officialData = await kakaoScraper.getPlaceDetails(kakaoId);

                console.log(`[Ingester] 📡 Fetching coordinates ONLY via Kakao REST API...`);
                // 검색 힌트로 가게명과 주소를 함께 사용
                const searchName = rawVision?.basicInfo.placenamefull || officialData?.name;
                const searchAddr = officialData?.address || rawVision?.basicInfo.address.addressname.fullAddress;
                const restData = await kakaoScraper.fetchFromREST(kakaoId, { name: searchName, address: searchAddr });

                if (restData && restData.lat !== 0) {
                    finalCoords = { lat: restData.lat, lon: restData.lng };
                    console.log(`[Ingester] ✅ Use REST API Coords: ${finalCoords.lat}, ${finalCoords.lon}`);
                }

                if (!finalCoords.lat) {
                    console.error(`❌ REST API를 통한 좌표 확보 실패.`);
                    continue;
                }

                if (!rawVision && (!officialData || (officialData.lat === 0 && !finalCoords.lat))) {
                    console.error(`❌ AI 분석 및 유효한 좌표 확보 실패. 스킵합니다.`);
                    continue;
                }

                // 3. 하이브리드 병합 (무결성 강화)
                const mergedKakao = {
                    basicInfo: {
                        placenamefull: rawVision?.basicInfo.placenamefull || officialData?.name || "Unknown Store",
                        address: rawVision?.basicInfo.address || { addressname: { fullAddress: officialData?.address || "" } },
                        category: { fullname: officialData?.category || "" },
                        wgs84: finalCoords,
                        phonenum: rawVision?.basicInfo.phonenum || officialData?.phone || "",
                        menu_items: rawVision?.basicInfo.menu_items || []
                    },
                    photo: rawVision?.photo || { selectedPhoto: { orgurl: officialData?.menu_image_url || "" } }
                };

                const cacheDir = path.join(process.cwd(), 'src', 'data', 'kakao_cache');
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

                if (!rawVision) {
                    fs.writeFileSync(path.join(cacheDir, `${kakaoId}_fail.json`), JSON.stringify({
                        status: "partial_success",
                        reason: "Vision failed, but Official data found",
                        mergedKakao
                    }, null, 2));
                }

                fs.writeFileSync(path.join(cacheDir, `${kakaoId}.json`), JSON.stringify(mergedKakao, null, 2));

                // 4. 수집 최종 처리
                const result = await collector.processLinkPair(youtubeUrl, kakaoUrl, mergedKakao);

                if (result.status === 'success') {
                    console.log(`✅ [${i + 1}/${lines.length}] 저장 성공: ${result.name} (좌표: ${mergedKakao.basicInfo.wgs84.lat}, ${mergedKakao.basicInfo.wgs84.lon})`);
                } else {
                    console.log(`⚠️ [${i + 1}/${lines.length}] 수집 실패: ${result.name}`);
                }

            } catch (err: any) {
                console.error(`❌ [${i + 1}/${lines.length}] 에러 발생:`, err.message);
            }

            if (i < lines.length - 1) {
                console.log(`   잠시 후 다음 업체로 이동합니다...`);
                await new Promise(r => setTimeout(r, 1000));
            }
        }

    } finally {
        console.log(`\n==================================================`);
        console.log(`🎉 모든 반자동 수집이 완료되었습니다!`);
        console.log(`📍 브라우저 창은 확인 후 수동으로 닫아주세요.`);
        console.log(`==================================================\n`);
        process.exit(0);
    }
}

runSemiAutoIngestion();
