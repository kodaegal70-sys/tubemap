-- Tube Map Engine v1.5 통합 스키마 (기존 필드 + 신규 스펙 통합 버전)
-- 주의: 이 스크립트는 기존 테이블을 삭제하고 새로 생성합니다.

-- 1. 기존 테이블 삭제
DROP TABLE IF EXISTS public.highlight_queue;
DROP TABLE IF EXISTS public.owner_upload_requests;
DROP TABLE IF EXISTS public.images;
DROP TABLE IF EXISTS public.media_sources;
DROP TABLE IF EXISTS public.places CASCADE;

-- 2. 'places' 테이블 생성
CREATE TABLE public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- [v1.5 핵심 필드]
  kakao_place_id TEXT UNIQUE,
  name_official TEXT,         -- 카카오 공식 명칭
  image_state TEXT DEFAULT 'pending', -- "approved" | "pending"
  
  -- [UI 호환 및 검색 필드]
  name TEXT NOT NULL,         -- 장소 이름 (기본 표시용)
  description TEXT,           -- 설명 또는 베스트 댓글
  media TEXT,                 -- 미디어 정보 (형식: "채널명|프로그램명")
  category TEXT,              -- 정규화된 카테고리 (한식, 일식 등)
  
  -- [좌표 및 주소]
  lat DOUBLE PRECISION,       -- 위도 (카카오 좌표 기준)
  lng DOUBLE PRECISION,       -- 경도 (카카오 좌표 기준)
  address TEXT,               -- 지번 주소
  road_address TEXT,          -- 도로명 주소
  address_province TEXT,      -- 시/도
  address_city TEXT,          -- 시/군/구
  address_district TEXT,      -- 읍/면/동
  
  -- [연락처 및 외부 링크]
  phone TEXT,                 -- 전화번호
  naver_url TEXT,             -- 네이버 지도 링크
  video_id TEXT,              -- (Legacy) 대표 영상 ID
  
  -- [Legacy 이미지 필드 - 하위 호환용]
  image_url TEXT              -- 대표 이미지 URL (images 테이블의 slot_index=1과 동기화 권장)
);

-- 3. 'media_sources' 테이블 생성
CREATE TABLE public.media_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID REFERENCES public.places(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL DEFAULT 'youtube',
    youtube_channel_id TEXT,
    youtube_video_id TEXT,
    video_url TEXT NOT NULL,
    timestamp TEXT, -- HH:MM:SS
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 'images' 테이블 생성
CREATE TABLE public.images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID REFERENCES public.places(id) ON DELETE CASCADE,
    image_type TEXT NOT NULL, -- youtube_thumbnail | exterior_snapshot | owner_photo
    url TEXT NOT NULL,
    slot_index INT DEFAULT 1,
    status TEXT DEFAULT 'pending', -- approved | pending | rejected
    source_video_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(place_id, image_type)
);

-- 5. 기타 관리 테이블
CREATE TABLE public.owner_upload_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID REFERENCES public.places(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.highlight_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID REFERENCES public.places(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    status TEXT DEFAULT 'active'
);

-- 6. 인덱스 설정
CREATE INDEX idx_places_kakao_place_id ON public.places(kakao_place_id);
CREATE INDEX idx_places_category ON public.places(category);
CREATE INDEX idx_places_address_province ON public.places(address_province);
CREATE INDEX idx_places_address_city ON public.places(address_city);
CREATE INDEX idx_media_sources_place_id ON public.media_sources(place_id);
CREATE INDEX idx_images_place_id ON public.images(place_id);

-- 7. 보안 정책 (RLS) 설정 - 전체 허용 (수정됨)
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_upload_requests ENABLE ROW LEVEL SECURITY;

-- 기존 정책 충돌 방지
DROP POLICY IF EXISTS "Public Access" ON public.places;
DROP POLICY IF EXISTS "Enable insert for all" ON public.places;
DROP POLICY IF EXISTS "Allow update for all" ON public.places;
DROP POLICY IF EXISTS "Enable All Access" ON public.places;

-- 모든 작업(조회/추가/수정/삭제) 허용 정책 적용
CREATE POLICY "Enable All Access" ON public.places FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All Access" ON public.media_sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All Access" ON public.images FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All Access" ON public.owner_upload_requests FOR ALL USING (true) WITH CHECK (true);
