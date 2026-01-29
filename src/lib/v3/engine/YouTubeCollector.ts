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
        } catch (error) {
            console.error("[YouTubeCollector] Search Error:", error);
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

            // Keyword Validation Check (Step 1 Sub-check)
            const tags = item.snippet.tags || [];
            const textToCheck = (item.snippet.title + " " + tags.join(" ")).toLowerCase();

            console.log(`[YouTubeCollector] DEBUG: Checking "${item.snippet.title}"`);

            // [Step 2 Exclusion] Reject Recipe/Cooking/Vlog
            for (const exclusion of CONFIG.VIDEO_TITLE_EXCLUSIONS) {
                if (textToCheck.includes(exclusion.toLowerCase())) {
                    console.log(`[YouTubeCollector] Skipped ${videoId}: Contains exclusion keyword "${exclusion}"`);
                    return null;
                }
            }

            let matchCount = 0;
            const matches: string[] = [];
            for (const kw of CONFIG.SEARCH_REQUIRED_KEYWORDS) {
                if (textToCheck.includes(kw.toLowerCase())) {
                    matchCount++;
                    matches.push(kw);
                }
            }

            if (matchCount < CONFIG.MIN_KEYWORDS_MATCH) {
                console.log(`[YouTubeCollector] Skipped ${videoId}: Low keyword match (${matchCount}). Found: [${matches.join(", ")}]`);
                console.log(`[YouTubeCollector] Required ${CONFIG.MIN_KEYWORDS_MATCH} from: ${CONFIG.SEARCH_REQUIRED_KEYWORDS.slice(0, 5).join(", ")}...`);
                return null;
            }

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
     * STEP 2: Extract Candidates (Regex Only)
     * Rule: No guessing. Strict parsing.
     */
    extractCandidates(text: string): CandidateInfo[] {
        const candidates: CandidateInfo[] = [];

        // Pattern 1: "Title l PlaceName" (Sung Si-kyung style)
        // Regex: l or | followed by text, ending with (, [, with, or end of line.
        const regex1 = /[l|\|]\s+(.*?)(\(|\swith|\[|$)/i;
        const match1 = text.match(regex1);

        if (match1 && match1[1]) {
            const raw = match1[1].trim();
            // Simple heuristic to split Area / Name if clear space exists
            // e.g. "Gangnam SomePlace" -> Area: Gangnam, Name: SomePlace
            const parts = raw.split(' ');
            if (parts.length >= 2 && parts[0].length >= 2) {
                candidates.push({
                    area: parts[0],
                    name: parts.slice(1).join(' ') // Name without area
                });
                // Also push full raw as name fallback
                candidates.push({ name: raw, area: parts[0] });
            } else {
                candidates.push({ name: raw });
            }
        }

        // Pattern 2: "PlaceName" in brackets [PlaceName]
        const regex2 = /\[(.*?)\]/;
        const match2 = text.match(regex2);
        if (match2 && match2[1]) {
            candidates.push({ name: match2[1].trim() });
        }

        // [New v1.6.1] Filter out Program Names and Channel Names from candidates
        const TECH_TERMS = ['eng', 'sub', 'shorts', 'ep.', '1탄', '2탄', '3탄', '모음', '스페셜', 'special'];
        const filtered = candidates
            .map(c => {
                let name = c.name.trim();
                // Strip technical terms from the name instead of rejecting the whole thing
                for (const term of TECH_TERMS) {
                    const regex = new RegExp(`\\s*${term.replace('.', '\\.')}\\s*`, 'gi');
                    name = name.replace(regex, ' ').trim();
                }
                return { ...c, name };
            })
            .filter(c => {
                const name = c.name.toLowerCase().trim();
                if (name.length < 2) return false;

                const isProgram = CONFIG.BROADCAST_PROGRAMS.some(p => p.toLowerCase().trim() === name);
                const isChannel = CONFIG.YOUTUBE_CHANNELS.some(ch => ch.toLowerCase().trim() === name);

                return !isProgram && !isChannel;
            });

        return filtered;
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
                return {
                    text: snippet?.textDisplay || "",
                    likes: snippet?.likeCount || 0
                };
            }) || [];

            // Sort by likes descending
            comments.sort((a, b) => b.likes - a.likes);

            if (comments.length > 0) {
                // Return top comment (Plain text)
                const top = comments[0];
                return {
                    text: top.text.replace(/<[^>]*>?/gm, ''), // Remove HTML
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
