import * as fs from 'fs';
import * as path from 'path';
import { checkCategoryMatch, Place } from '../src/data/places';

/**
 * [세탁기] offline_places.json의 카테고리를 places.ts의 최신 로직에 따라 재분류
 */
async function main() {
    const filePath = path.join(process.cwd(), 'src', 'data', 'offline_places.json');

    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        return;
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const places: any[] = JSON.parse(rawData);

    console.log(`[Cleaner] Starting re-classification for ${places.length} items...`);

    const categories = ['한식', '중식', '일식', '양식', '분식', '기타'];
    let changedCount = 0;

    const cleanedPlaces = places.map(place => {
        const oldCategory = place.category;

        // 최신 로직 적용
        let newCategory = '기타';
        for (const cat of categories) {
            if (checkCategoryMatch(place as unknown as Place, [cat])) {
                newCategory = cat;
                break;
            }
        }

        // 단순화된 카테고리 (음식점 > 한식 > 육류... -> 한식)
        if (oldCategory !== newCategory) {
            changedCount++;
            return { ...place, category: newCategory };
        }

        return place;
    });

    if (changedCount > 0) {
        fs.writeFileSync(filePath, JSON.stringify(cleanedPlaces, null, 2), 'utf-8');
        console.log(`[Cleaner] ✅ Successfully updated ${changedCount} items.`);
    } else {
        console.log(`[Cleaner] ✨ No changes needed. All items are correctly classified.`);
    }
}

main().catch(console.error);
