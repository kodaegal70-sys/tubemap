import * as fs from 'fs';
import * as path from 'path';
import { CuratedCollector } from '../src/lib/v3/engine/CuratedCollector';
import { KakaoBrowserScraper } from '../src/lib/v3/extractor/KakaoBrowserScraper';
import { KakaoScraper } from '../src/lib/v3/extractor/KakaoScraper';

/**
 * [B 방식] 대량 수집 최적화 브라우저 인제스터
 */
async function runBatchBrowserIngestion() {
    const inputPath = path.join(process.cwd(), 'scripts', 'paste_data.txt');

    if (!fs.existsSync(inputPath)) {
        console.error("❌ paste_data.txt 파일이 없습니다. [유튜브링크]\\t[카카오링크] 형식으로 작성해주세요.");
        return;
    }

    const content = fs.readFileSync(inputPath, 'utf-8');
    const lines = content.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith('#')); // 주석처리(#) 지원

    if (lines.length === 0) {
        console.warn("⚠️ 처리할 링크가 없습니다.");
        return;
    }

    console.log(`\n==================================================`);
    console.log(`🚀 대량 수집 시작 (총 ${lines.length}건)`);
    console.log(`==================================================\n`);

    const collector = new CuratedCollector();
    const browserScraper = new KakaoBrowserScraper();
    const parser = new KakaoScraper();

    try {
        await browserScraper.init();

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const parts = line.split('\t').map(p => p.trim());

            if (parts.length < 2) {
                console.warn(`[${i + 1}/${lines.length}] ⚠️ 줄 형식 오류 (유튜브[탭]카카오 필요): ${line}`);
                continue;
            }

            const [youtubeUrl, kakaoUrl] = parts;
            console.log(`\n[${i + 1}/${lines.length}] 진행 중...`);

            try {
                const kakaoId = parser.extractPlaceId(kakaoUrl);
                if (!kakaoId) throw new Error("유효하지 않은 카카오 링크");

                // 1. 브라우저로 카카오 데이터 가져오기 (지능적 대기 포함)
                const rawKakao = await browserScraper.getPlaceDetails(kakaoId);

                if (rawKakao) {
                    const cacheDir = path.join(process.cwd(), 'src', 'data', 'kakao_cache');
                    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
                    fs.writeFileSync(path.join(cacheDir, `${kakaoId}.json`), JSON.stringify(rawKakao, null, 2));
                }

                // 2. 수집 실행 (브라우저에서 얻은 데이터를 직접 주입)
                const result = await collector.processLinkPair(youtubeUrl, kakaoUrl, rawKakao);

                if (result.status === 'success') {
                    console.log(`✅ 저장 성공: ${result.name}`);
                } else {
                    console.log(`⚠️ 수집 보류: ${result.name || result.reason}`);
                }

                // 3. 사람처럼 보이기 위한 랜덤 대기 (2~4초)
                if (i < lines.length - 1) {
                    const delay = 2000 + Math.random() * 2000;
                    process.stdout.write(`   잠시 대기 중 (${(delay / 1000).toFixed(1)}초)... `);
                    await new Promise(r => setTimeout(r, delay));
                    console.log("OK");
                }

            } catch (err: any) {
                console.error(`❌ 처리 실패 [${line}]:`, err.message);
                // 실패해도 다음 항목으로 계속 진행
            }
        }

    } finally {
        await browserScraper.close();
        console.log(`\n==================================================`);
        console.log(`🎉 모든 수집 완료! (총 ${lines.length}건)`);
        console.log(`==================================================\n`);
    }
}

runBatchBrowserIngestion();
