-- Tube Map Engine v1.5 스키마 업데이트 SQL
-- 10절 DB 저장 규격 및 5절 이미지 규칙 준수

-- 1. places 테이블 수정 및 추가 필드
ALTER TABLE places 
ADD COLUMN IF NOT EXISTS kakao_place_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS image_state TEXT DEFAULT 'pending', -- "approved" | "pending"
ADD COLUMN IF NOT EXISTS road_address TEXT;

-- 기존 name 컬럼이 name_official 역할 수행하도록 보완 (필요 시)
-- ALTER TABLE places RENAME COLUMN name TO name_official;

-- 2. media_sources 테이블 생성 (출처 증빙 정규화)
CREATE TABLE IF NOT EXISTS media_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID REFERENCES places(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL, -- youtube | tv
    youtube_channel_id TEXT,
    youtube_video_id TEXT,
    video_url TEXT NOT NULL,
    timestamp TEXT, -- HH:MM:SS 또는 NULL
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_sources_place_id ON media_sources(place_id);
CREATE INDEX IF NOT EXISTS idx_media_sources_video_id ON media_sources(youtube_video_id);

-- 3. images 테이블 생성 (단일 이미지 슬롯 관리)
CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID REFERENCES places(id) ON DELETE CASCADE,
    image_type TEXT NOT NULL, -- youtube_thumbnail | exterior_snapshot | owner_photo
    url TEXT NOT NULL,
    slot_index INT DEFAULT 1, -- v1.5 스펙: 항상 1
    status TEXT DEFAULT 'pending', -- approved | pending | rejected
    source_video_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(place_id, image_type) -- 13절 권장사항
);

CREATE INDEX IF NOT EXISTS idx_images_place_id ON images(place_id);

-- 4. 사장 업로드 및 상단 고정 관련 테이블 (미래 확장성)
CREATE TABLE IF NOT EXISTS owner_upload_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID REFERENCES places(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- pending | approved | rejected
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS highlight_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID REFERENCES places(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    status TEXT DEFAULT 'active'
);

-- 5. RLS 정책 (기본 읽기 허용)
ALTER TABLE media_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on media_sources" ON media_sources FOR SELECT USING (true);
CREATE POLICY "Allow public read on images" ON images FOR SELECT USING (true);

-- 6. 카테고리 인덱스 재확인
CREATE INDEX IF NOT EXISTS idx_places_kakao_place_id ON places(kakao_place_id);
