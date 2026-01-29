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

            const validKeywords = CONFIG.SEARCH_REQUIRED_KEYWORDS || [];
            const foundKeywords: string[] = [];
            for (const kw of validKeywords) {
                if (textToCheck.includes(kw.toLowerCase())) {
                    foundKeywords.push(kw);
                }
            }
            const matchCount = foundKeywords.length;

            // [MVP] Disable Strict Keyword Filter here. relying on DescriptionGate later.
            if (matchCount < (CONFIG.MIN_KEYWORDS_MATCH || 1)) {
                console.log(`[YouTubeCollector] Low keyword match for ${videoId} (${matchCount}). Found: ${foundKeywords.join(', ')}`);
                console.log(`[YouTubeCollector] Required ${CONFIG.MIN_KEYWORDS_MATCH} from: ${validKeywords.slice(0, 5).join(', ')}...`);
                // return null; // Commented out to relax the check
            }

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

        // Pattern 3: Explicit "XX맛집" or "XX식당" pattern (New V1.6.1)
        // Extract "Name" from "Name맛집", "Name식당"
        const regex3 = /([가-힣\w\s]+?)(맛집|식당|반점|가게|집)(\s|$|:)/;
        const match3 = text.match(regex3);
        if (match3 && match3[1]) {
            const nameCandidate = match3[1].trim();
            // Avoid extracting just the region name (e.g. "강남맛집" -> "강남")
            // Simple check: length > 1
            if (nameCandidate.length > 1) {
                candidates.push({ name: nameCandidate });
            }
        }

        // Pattern 4: "XXX님 XXX집" or "XXX집" (Strict short phrase)
        // Limit length to avoid capturing sentences.
        const regex4 = /([가-힣\w]{2,10}?)(님)?\s*([가-힣\w\s]{0,10}?)(집|가게|식당|반점)(?=\s|$|:|[!.,])/;
        const match4 = text.match(regex4);
        if (match4) {
            let nameCandidate = "";
            if (match4[2]) { // If "님" is present, combine first and third group
                nameCandidate = `${match4[1].trim()} ${match4[3].trim()}${match4[4].trim()}`;
            } else { // Otherwise, it's just the third group + suffix
                // Check if Group 3 is empty (e.g. "짬뽕집" without prefix?) -> Skip
                if (match4[3].trim().length > 0 || match4[1].trim().length > 0) {
                    // If Group 3 is empty, maybe Group 1 is the name?
                    // Case: "이봉원님 짬뽕집" -> G1=이봉원, G2=님, G3=짬뽕, G4=집
                    // Case: "짬뽕집" -> G1=짬뽕, G4=집
                    nameCandidate = `${match4[1].trim()} ${match4[3].trim()}${match4[4].trim()}`;
                }
            }
            if (nameCandidate.length > 2) { // Too short is risky
                candidates.push({ name: nameCandidate.replace(/\s+/g, ' ').trim() });
            }
        }

        // [New v1.6.1] Filter out Program Names, Channel Names, and Noise Keywords from candidates
        const TECH_TERMS = ['eng', 'sub', 'shorts', 'ep.', '1탄', '2탄', '3탄', '모음', '스페셜', 'special'];
        const NOISE_KEYWORDS = [
            '맛집', '먹방', 'mukbang', '리뷰', 'review', 'vlog', '브이로그',
            '도전먹방', '도전 먹방', '술먹방', '혼술', '노포', '가게', '식당', '집', '점',
            '성공', '실패', '다먹으면'
        ];

        const filtered = candidates
            .map(c => {
                let name = c.name.trim();
                // Strip technical terms
                for (const term of TECH_TERMS) {
                    const regex = new RegExp(`\\s*${term.replace('.', '\\.')}\\s*`, 'gi');
                    name = name.replace(regex, ' ').trim();
                }
                return { ...c, name };
            })
            .filter(c => {
                const name = c.name.toLowerCase().trim();
                if (name.length < 2) return false;

                // 1. Check Noise Keywords (Exact)
                // Reject if name is EXACTLY a noise keyword
                if (NOISE_KEYWORDS.some(n => n === name)) return false;

                // 2. Check Logic: "Category + Suffix" only? (e.g. "짬뽕집") -> Weak candidate
                // But "이봉원님 짬뽕집" -> Strong.
                // If name ends with '맛집' and is short, reject.
                if (name.endsWith('맛집') && name.length < 5) return false; // "찐맛집" reject

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
