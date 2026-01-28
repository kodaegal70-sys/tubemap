-- Supabase 스키마 업데이트 SQL (수정본)
-- places 테이블에 주소 계층 구조 컬럼 추가
-- Supabase는 snake_case 사용

-- 1. 주소 계층 구조 컬럼 추가 (snake_case)
ALTER TABLE places 
ADD COLUMN IF NOT EXISTS address_province TEXT,
ADD COLUMN IF NOT EXISTS address_city TEXT,
ADD COLUMN IF NOT EXISTS address_district TEXT;

-- 2. 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_places_address_province ON places(address_province);
CREATE INDEX IF NOT EXISTS idx_places_address_city ON places(address_city);
CREATE INDEX IF NOT EXISTS idx_places_address_district ON places(address_district);

-- 3. 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'places' 
  AND column_name IN ('address_province', 'address_city', 'address_district');
