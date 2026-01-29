import { supabase } from './supabaseClient';

/**
 * Tube Map Engine v2.0: 이미지 영구 저장소 관리 모듈
 * 최적화된 WebP 이미지를 Supabase Storage에 업로드하고 공용 URL을 반환합니다.
 */
export async function uploadOptimizedImage(
    buffer: Buffer,
    fileName: string,
    contentType: string = 'image/webp'
): Promise<string | null> {
    if (!supabase) {
        console.warn('[Engine v2.0] Supabase client not initialized. Skipping upload.');
        return null;
    }

    try {
        const { data, error } = await supabase.storage
            .from('images')
            .upload(`places/${fileName}`, buffer, {
                contentType,
                upsert: true // 이미 존재하면 덮어쓰기
            });

        if (error) {
            throw error;
        }

        // 공용 URL 생성
        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(`places/${fileName}`);

        return publicUrl;
    } catch (error: any) {
        console.error('[Engine v2.0] Supabase upload failed:', error.message);
        return null;
    }
}
