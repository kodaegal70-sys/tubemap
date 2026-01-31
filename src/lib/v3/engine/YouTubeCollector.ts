/**
 * TubeMap Engine v1.6: YouTube Collector
 * Handles API interactions and strict metadata extraction.
 */
import { google } from 'googleapis';
import { CONFIG } from './config';

const youtube = google.youtube('v3');

export interface VideoMetadata {
    videoId: string;
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    thumbnailUrl: string;
}

export interface CandidateInfo {
    name: string;
    menu?: string;
    area?: string;
}

export class YouTubeCollector {
    private apiKey: string;

    constructor() {
        this.apiKey = CONFIG.API_KEYS.YOUTUBE;
        if (!this.apiKey) throw new Error("YOUTUBE_API_KEY is missing");
    }

    /**
     * STEP 1: Search Videos
     * Filter: Must contain 2+ keywords from config
     */
    async searchVideos(query: string, limit: number = 5): Promise<string[]> {
        try {
            const response = await youtube.search.list({
                key: this.apiKey,
                part: ['id', 'snippet'],
                q: query,
                type: ['video'],
                maxResults: limit,
                order: 'viewCount', // 조회수 기준 정렬 (Spec)
                regionCode: 'KR'
            });

            return response.data.items
                ?.map(item => item.id?.videoId)
                .filter((id): id is string => !!id) || [];
        } catch (error: any) {
            console.error("[YouTubeCollector] Search Error:", error.response ? error.response.data : error.message);
            return [];
        }
    }

    /**
     * STEP 2: Get Video Details
     */
    async getVideoDetails(videoId: string): Promise<VideoMetadata | null> {
        try {
            const response = await youtube.videos.list({
                key: this.apiKey,
                part: ['snippet'],
                id: [videoId]
            });

            const item = response.data.items?.[0];
            if (!item || !item.snippet) return null;

            console.log(`[YouTubeCollector] Fetched ${videoId}: "${item.snippet.title}"`);

            console.log(`[YouTubeCollector] Fetched ${videoId}: "${item.snippet.title}"`);
            return {
                videoId: videoId,
                title: item.snippet.title || "",
                description: item.snippet.description || "",
                channelTitle: item.snippet.channelTitle || "",
                publishedAt: item.snippet.publishedAt || new Date().toISOString(),
                thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || ""
            };
        } catch (error) {
            console.error(`[YouTubeCollector] Details Error (${videoId}):`, error);
            return null;
        }
    }



    /**
     * STEP 7: Fetch Comments
     * Top liked, filtered by business name relevance (optional)
     */
    async getBestComment(videoId: string): Promise<{ text: string, likes: number } | null> {
        try {
            const response = await youtube.commentThreads.list({
                key: this.apiKey,
                part: ['snippet'],
                videoId: videoId,
                order: 'relevance', // likes logic handled by YouTube's relevance or we sort manually
                maxResults: 10
            });

            const comments = response.data.items?.map(item => {
                const snippet = item.snippet?.topLevelComment?.snippet;
                const text = snippet?.textDisplay || "";

                // 광고 필터: 링크(http, https, www)가 포함된 경우 제외
                if (text.match(/https?:\/\/[^\s]+/) || text.includes('www.')) {
                    return null;
                }

                return {
                    text: text,
                    likes: snippet?.likeCount || 0
                };
            }).filter((c): c is { text: string, likes: number } => c !== null) || [];

            // Sort by likes descending
            comments.sort((a, b) => b.likes - a.likes);

            if (comments.length > 0) {
                // Return top comment (Plain text, limited to 3 lines)
                const top = comments[0];
                const cleanText = top.text.replace(/<[^>]*>?/gm, ''); // Remove HTML

                const lines = cleanText.split('\n');
                const truncatedText = lines.length > 3
                    ? lines.slice(0, 3).join('\n') + '...'
                    : cleanText;

                return {
                    text: truncatedText,
                    likes: top.likes
                };
            }
            return null;

        } catch (error) {
            // Comments might be disabled
            return null;
        }
    }
}
