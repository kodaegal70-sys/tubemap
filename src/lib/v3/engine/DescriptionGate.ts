/**
 * DescriptionGate.ts
 * "Description-First Gate": Only parses Description to decide Pass/Skip.
 */

export type DescParseResult = {
    storeName: string | null;
    regionHint: string | null;
    pass: boolean;
};

// 1. Region Regex (Address hints) - Strict boundary checking
const REGION_REGEX = /(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)\s+[가-힣\w]{1,10}(시|군|구|읍|면|동|로|길)(?=\s|$|[0-9])/;

export class DescriptionGate {

    static parseDescription(descRaw: string): DescParseResult {
        const desc = (descRaw || "").replace(/\r/g, "\n").trim();

        if (!desc || desc.length < 20) {
            return { storeName: null, regionHint: null, pass: false };
        }

        const regionMatch = desc.match(REGION_REGEX);
        let regionHint = regionMatch ? regionMatch[0].trim() : null;

        let storeName: string | null = null;

        // Split by lines to prioritize top-down
        const lines = desc.split('\n');

        // Combined Pattern List (Ordered by priority)
        // [Refined v3.2] Use more permissive patterns to include emojis/symbols inside
        const PREFERRED_PATTERNS = [
            /\[([^\]\n]{2,30})\]/,                          // [가게명]
            /(상호|가게|매장|장소)\s*[:：]\s*([^\n]{2,30})/, // 상호: 가게명
            /["'“‘]([^"'”’\n]{2,20})["'”’]/,                // "따옴표"
            /\(([^)\n]{2,20})\)/,                          // (괄호)
            /\{([^}\n]{2,20})\}/,                          // {중괄호}
            /([가-힣0-9]{2,20})(본점|직영점|점)\b/,               // OO점
            /#([^\s#\n]{2,20})/                                // #해시태그
        ];

        // 1) Search for preferred patterns in each line (Top-Down)
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length < 2) continue;

            for (const regex of PREFERRED_PATTERNS) {
                const m = trimmed.match(regex);
                if (m) {
                    const candidate = (m[1] || m[2] || "").trim();
                    if (candidate.length >= 2 && candidate.length <= 30) {
                        storeName = candidate;
                        break;
                    }
                }
            }
            if (storeName) break;
        }

        const pass = !!(storeName && regionHint);

        return { storeName, regionHint, pass };
    }
}
