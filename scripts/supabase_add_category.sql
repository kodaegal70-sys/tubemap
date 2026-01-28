-- Supabase 스키마 업데이트 SQL
-- places 테이블에 category 컬럼 추가

-- 1. category 컬럼 추가
ALTER TABLE places 
ADD COLUMN IF NOT EXISTS category TEXT;

-- 2. 기본값 설정 (선택사항)
-- ALTER TABLE places 
-- ALTER COLUMN category SET DEFAULT '기타';

-- 3. 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);

-- 4. 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'places' AND column_name = 'category';
