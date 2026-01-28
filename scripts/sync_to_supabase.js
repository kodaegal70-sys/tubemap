const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function syncToSupabase() {
    const placesPath = path.join(__dirname, '..', 'src', 'data', 'places.json');
    const placesData = JSON.parse(fs.readFileSync(placesPath, 'utf-8'));

    // camelCase를 snake_case로 변환하는 함수
    function toSnakeCase(obj) {
        const snakeCaseObj = {};
        for (const [key, value] of Object.entries(obj)) {
            // camelCase를 snake_case로 변환
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            snakeCaseObj[snakeKey] = value;
        }
        return snakeCaseObj;
    }

    // 모든 데이터를 snake_case로 변환
    const placesForSupabase = placesData.map(place => toSnakeCase(place));

    console.log(`🚀 Supabase 동기화 시작 (대상: ${placesForSupabase.length}개)...`);

    // 기존 데이터 전체 삭제 (또는 Upsert를 위해 매핑)
    // 여기서는 안전하게 Upsert(이름+주소 기준)를 시도하거나, 
    // 유저의 요청이 '깨끗한 데이터'이므로 기존 데이터를 정리하고 새로 넣는 방식이 확실함.

    // 주의: 실제 운영 환경이라면 Delete는 신중해야 하지만, 현재 개발 단계이므로 
    // 구 버전 데이터를 밀어버리고 정제된 데이터를 넣는 것이 가장 확실한 버그 해결책임.

    const { error: deleteError } = await supabase
        .from('places')
        .delete()
        .neq('id', 0); // 전체 삭제 트릭

    if (deleteError) {
        console.error('❌ 기존 데이터 삭제 실패:', deleteError.message);
        return;
    }

    console.log('✅ 기존 데이터 정리 완료. 새 데이터를 삽입합니다...');

    // Supabase 테이블 스케마에 맞는 컬럼만 추출하여 삽입
    const uploadData = placesForSupabase.map(p => ({
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        media: p.media,
        description: p.description,
        address: p.address,
        phone: p.phone,
        image_url: p.image_url,
        naver_url: p.naver_url,
        category: p.category,
        address_province: p.address_province,
        address_city: p.address_city,
        address_district: p.address_district
    }));

    // 10개씩 끊어서 배치 업로드 (안정성)
    for (let i = 0; i < uploadData.length; i += 10) {
        const chunk = uploadData.slice(i, i + 10);
        const { error: insertError } = await supabase
            .from('places')
            .insert(chunk);

        if (insertError) {
            console.error(`❌ 데이터 삽입 실패 (Batch ${i / 10 + 1}):`, insertError.message);
        } else {
            console.log(`✅ Batch ${i / 10 + 1} 업로드 완료`);
        }
    }

    console.log('\n✨ Supabase 데이터 동기화가 완료되었습니다!');
}

syncToSupabase();
