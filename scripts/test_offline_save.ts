
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'src', 'data', 'offline_places.json');
console.log(`[Test] Target Path: ${filePath}`);

const testData = {
    kakao_place_id: 12345,
    name: "Test Place",
    channels: "Test Channel"
};

try {
    let currentData = [];
    if (fs.existsSync(filePath)) {
        console.log("[Test] File exists, reading...");
        currentData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } else {
        console.log("[Test] File does not exist, creating new array.");
    }

    currentData.push(testData);

    fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));
    console.log("[Test] Write successful!");
} catch (e) {
    console.error("[Test] Write failed:", e);
}
