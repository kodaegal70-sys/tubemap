/**
 * TubeMap Engine Configuration
 * API Keys and basic constants.
 */
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables locally if not already loaded
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

export const CONFIG = {
    API_KEYS: {
        YOUTUBE: process.env.YOUTUBE_API_KEY || '',
        KAKAO: process.env.KAKAO_LOCAL_API_KEY || ''
    }
};
