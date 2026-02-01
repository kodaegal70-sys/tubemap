import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { SiteScraper } from './lib/v3/extractor/SiteScraper';
import { CuratedCollector } from './lib/v3/engine/CuratedCollector';

dotenv.config({ path: '.env.local' });

const LOG = {
    step: (msg: string) => console.log(`\n[STEP] ${msg}`),
    ok: (msg: string) => console.log(`  [OK] ${msg}`),
    warn: (msg: string) => console.warn(`  [WARN] ${msg}`),
    fail: (msg: string) => console.error(`  [FAIL] ${msg}`),
    risk: (msg: string) => console.warn(`  [RISK] ${msg}`),
    detail: (msg: string) => console.log(`    ${msg}`)
};

/**
 * [자동 수집 엔진] 유튜브 플레이스 사이트에서 신규 데이터를 수집하여 저장
 * 한 번 실행 시 흐름·문제 구간·오류/정확성 위험을 로그로 확인 가능
 */
async function main() {
    const scraper = new SiteScraper();
    const collector = new CuratedCollector();
    const TARGET_LIMIT = 2; // 테스트를 위해 2개로 설정
    let totalNewItems = 0;

    // ---- 진단: 환경 및 경로 ----
    LOG.step('1. 환경·경로 점검');
    const cwd = process.cwd();
    LOG.detail(`CWD: ${cwd}`);
    const hasYoutube = !!process.env.YOUTUBE_API_KEY;
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    if (hasYoutube) LOG.ok('YOUTUBE_API_KEY 있음'); else LOG.fail('YOUTUBE_API_KEY 없음 → YouTube 조회 실패 위험');
    if (hasSupabaseUrl) LOG.ok('NEXT_PUBLIC_SUPABASE_URL 있음'); else LOG.warn('NEXT_PUBLIC_SUPABASE_URL 없음 → DB 저장 불가');
    if (hasSupabaseKey) LOG.ok('Supabase KEY 있음'); else LOG.warn('Supabase KEY 없음 → DB 저장 불가');

    const offlinePath = path.join(cwd, 'src', 'data', 'offline_places.json');
    const offlineExists = fs.existsSync(offlinePath);
    LOG.detail(`offline_places.json: ${offlinePath} (${offlineExists ? '존재' : '없음'})`);
    let existingData: any[] = [];
    if (offlineExists) {
        try {
            existingData = JSON.parse(fs.readFileSync(offlinePath, 'utf-8'));
            LOG.ok(`기존 레코드 ${existingData.length}개 로드`);
        } catch (e: any) {
            LOG.fail(`offline_places.json 파싱 실패: ${e.message}`);
        }
    } else {
        LOG.detail('기존 데이터 없음 → 전체 신규 처리');
    }

    const existingIds = new Set(existingData.map((p: any) => p.name + (p.address || '')));
    LOG.step('2. 수집 목표');
    LOG.detail(`TARGET_LIMIT: ${TARGET_LIMIT}, 중복 제외 키: name+address (${existingIds.size}개)`);

    await scraper.init();

    // 수집 대상 채널 (SiteScraper.CHANNEL_ID_MAP 키와 완전 일치해야 함)
    const channels = [
        '비밀이야', '성시경 SUNG SI KYUNG', '스튜디오 수제 (또간집)', '더들리',
        '정육왕 MeatCreator', '떡볶퀸 Tteokbokqueen', '섬마을훈태TV',
        '맛있겠다 Yummy', '김사원세끼', '회사랑', '츄릅켠 Chulupkyeon'
    ];

    LOG.step('3. 채널 목록 (CHANNEL_ID_MAP 키와 불일치 시 해당 채널 0건 → 수집 안 됨)');
    channels.forEach((ch, i) => LOG.detail(`${i + 1}. ${ch}`));

    const stats = { channelsWithItems: 0, channelsEmpty: 0, detailNull: 0, skipped: 0, error: 0, duplicate: 0 };

    try {
        for (const targetChannel of channels) {
            if (totalNewItems >= TARGET_LIMIT) break;

            LOG.step(`4. 채널: "${targetChannel}" — 목록 API 호출`);
            let basicItems: any[] = [];
            try {
                basicItems = await scraper.getRestaurantsFromChannel(targetChannel, 100);
                if (basicItems.length === 0) {
                    stats.channelsEmpty++;
                    LOG.warn(`목록 0건 → CHANNEL_ID_MAP 키 불일치 또는 API 데이터 없음 가능`);
                } else {
                    stats.channelsWithItems++;
                    LOG.ok(`목록 ${basicItems.length}건`);
                }
            } catch (e: any) {
                stats.error++;
                LOG.fail(`getRestaurantsFromChannel 실패: ${e.message}`);
                continue;
            }

            for (const item of basicItems) {
                if (totalNewItems >= TARGET_LIMIT) break;

                if (existingIds.has(item.name + (item.address || ''))) {
                    stats.duplicate++;
                    process.stdout.write('.');
                    continue;
                }

                LOG.detail(`--- 아이템: ${item.name} (id=${item.id}, videoId=${item.sourceVideoId || '없음'})`);
                if (!item.sourceVideoId) LOG.risk('sourceVideoId 없음 → 상세/YouTube 연동 실패 가능');

                try {
                    LOG.detail('상세 페이지 조회 중...');
                    const detail = await scraper.getRestaurantDetail(item.id, {
                        videoId: item.sourceVideoId,
                        name: item.name,
                        address: item.address
                    });
                    if (!detail) {
                        stats.detailNull++;
                        LOG.fail('getRestaurantDetail null → 스킵 (페이지 파싱 실패 또는 __NEXT_DATA__ 없음 가능)');
                        continue;
                    }
                    LOG.ok(`상세 수집됨: lat=${detail.lat}, lng=${detail.lng}, kakaoId=${detail.kakaoId ?? 'null'}, youtubeUrl=${detail.youtubeUrl ? '있음' : '없음'}`);
                    if (!detail.youtubeUrl) LOG.risk('youtubeUrl 없음 → processLinkPair 실패 가능');
                    if (detail.lat === 0 && detail.lng === 0) LOG.risk('좌표 0,0 → 지도 표시/정확성 위험');

                    LOG.detail('processLinkPair (YouTube+화이트리스트+카카오/사이트 병합) 호출...');
                    const result = await collector.processLinkPair(detail.youtubeUrl, null, detail);

                    if (result.status === 'success') {
                        totalNewItems++;
                        LOG.ok(`수집 성공 (${totalNewItems}/${TARGET_LIMIT}): ${result.name}`);
                    } else if (result.status === 'skipped') {
                        stats.skipped++;
                        LOG.warn(`건너뜀: ${result.reason} (name=${result.name})`);
                    } else {
                        stats.error++;
                        LOG.fail(`실패: ${result.reason} (name=${result.name})`);
                    }

                    const delay = Math.floor(Math.random() * 3000) + 5000;
                    LOG.detail(`딜레이 ${delay}ms...`);
                    await new Promise(r => setTimeout(r, delay));

                } catch (err: any) {
                    stats.error++;
                    LOG.fail(`처리 예외: ${err?.message ?? err}`);
                    LOG.detail(String(err?.stack ?? ''));
                }
            }
        }
    } finally {
        await scraper.close();

        LOG.step('5. 실행 요약');
        LOG.detail(`추가된 건수: ${totalNewItems}`);
        LOG.detail(`목록 있는 채널: ${stats.channelsWithItems}, 목록 0건 채널: ${stats.channelsEmpty}`);
        LOG.detail(`상세 null: ${stats.detailNull}, 스킵(화이트리스트 등): ${stats.skipped}, 중복 스킵: ${stats.duplicate}, 오류: ${stats.error}`);
        if (stats.channelsEmpty > 0) LOG.warn('목록 0건 채널 있음 → SiteScraper.CHANNEL_ID_MAP 키와 채널명 일치 여부 확인');
        if (stats.detailNull > 0) LOG.warn('상세 null 있음 → youtubeplace.co.kr 페이지 구조 또는 __NEXT_DATA__ 변경 가능');
        if (stats.error > 0) LOG.fail('오류 발생 건 있음 → 위 [FAIL] 로그 확인');
        console.log('\n[Ingest] Finished.\n');
    }
}

main().catch((e) => {
    console.error('[Ingest] Fatal:', e);
    process.exit(1);
});
