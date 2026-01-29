-- TubeMap Engine v1.6 Schema
-- Spec: TubeMap Automatic Collection Engine Operation Guidelines

-- 1. Places (Updated)
CREATE TABLE IF NOT EXISTS public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Core Identification
  kakao_place_id TEXT UNIQUE,
  name_official TEXT,         -- Kakao Official Name
  
  -- UI & Search Fields
  name TEXT NOT NULL,         -- Display Name
  description TEXT,           -- From Video Description or Comment
  category TEXT,              -- Normalized Category
  
  -- Address & Location
  address TEXT,               -- Jibun
  road_address TEXT,          -- Road Name
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  
  -- Contact & Info
  phone TEXT,
  menu_primary TEXT,          -- Extracted Menu
  
  -- Media & Content Source
  channel_title TEXT,         -- YouTube Channel Name
  media_label TEXT,           -- "Channel Name | Program Name"
  video_id TEXT,              -- Main Source Video ID
  video_url TEXT,             -- Main Source Video URL
  published_at TIMESTAMPTZ,   -- Video Publish Date
  
  -- Social Proof
  best_comment TEXT,          -- Selected Review Comment
  best_comment_like_count INT DEFAULT 0,
  
  -- Image Management
  image_state TEXT DEFAULT 'pending', -- approved, pending
  image_url TEXT,             -- Representative Image URL
  image_type TEXT DEFAULT 'youtube_thumbnail' -- youtube_thumbnail, owner_upload
);

-- Update existing table if needed (Migration)
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS best_comment TEXT;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS best_comment_like_count INT DEFAULT 0;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS channel_title TEXT;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS image_state TEXT DEFAULT 'pending';
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS image_type TEXT DEFAULT 'youtube_thumbnail';
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS media_label TEXT;


-- 2. Processed Videos (New: Deduplication & Status)
CREATE TABLE IF NOT EXISTS public.processed_videos (
  video_id TEXT PRIMARY KEY,
  status TEXT NOT NULL, -- processed, skipped, failed
  fail_reason TEXT,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Review Queue (New: Manual Logic Fallback)
CREATE TABLE IF NOT EXISTS public.review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT,
  candidate_store_name TEXT,
  candidate_menu TEXT,
  candidate_address_hint TEXT,
  score INT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Owner Upload Requests (Existing)
CREATE TABLE IF NOT EXISTS public.owner_upload_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES public.places(id) ON DELETE CASCADE,
  kakao_place_id TEXT,
  status TEXT DEFAULT 'pending',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Images (For Gallery - existing but aligned)
CREATE TABLE IF NOT EXISTS public.images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID REFERENCES public.places(id) ON DELETE CASCADE,
    image_type TEXT NOT NULL,
    url TEXT NOT NULL,
    slot_index INT DEFAULT 1,
    status TEXT DEFAULT 'approved',
    source_video_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(place_id, image_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_places_kakao ON public.places(kakao_place_id);
CREATE INDEX IF NOT EXISTS idx_places_category ON public.places(category);
CREATE INDEX IF NOT EXISTS idx_processed_videos_status ON public.processed_videos(status);

-- RLS (Enable All) - Idempotent
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_upload_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid 42710 error
DROP POLICY IF EXISTS "Enable All" ON public.places;
DROP POLICY IF EXISTS "Enable All" ON public.processed_videos;
DROP POLICY IF EXISTS "Enable All" ON public.review_queue;
DROP POLICY IF EXISTS "Enable All" ON public.images;
DROP POLICY IF EXISTS "Enable All" ON public.owner_upload_requests;

CREATE POLICY "Enable All" ON public.places FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All" ON public.processed_videos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All" ON public.review_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All" ON public.images FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All" ON public.owner_upload_requests FOR ALL USING (true) WITH CHECK (true);
