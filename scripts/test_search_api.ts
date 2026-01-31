
import fetch from 'node-fetch';

async function testApi() {
    // Hardcoded for connectivity test only
    const apiKey = "AIzaSyAOb4RGakTcF3z5sC8bQ6QzLgfsB9zcHCU";
    const cx = "40a7465f3e76c46e7";

    console.log(`[Test] Key: ${apiKey.substring(0, 5)}...`);
    console.log(`[Test] CX: ${cx}`);

    const query = "test image";
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&searchType=image&num=1`;

    console.log(`[Test] Sending request...`);
    try {
        const res = await fetch(url);
        const data = await res.json();

        if (res.ok) {
            console.log("✅ API Success! Found items:", data.items?.length || 0);
        } else {
            console.error("❌ API Failed:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("❌ Request Error:", e);
    }
}

testApi();
