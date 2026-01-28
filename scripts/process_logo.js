
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'public', 'images', 'logo.png');
const tempPath = path.join(__dirname, '..', 'public', 'images', 'logo_temp.png');

async function processLogo() {
    console.log('🎨 Processing logo to add transparency...');

    try {
        // 1. Read the image
        // 2. Linear color space processing for better thresholding
        // 3. Remove white background (approx #FFFFFF)
        // Since simple 'trim' might not work if it's a full square, we use a trick:
        // Convert to png, ensure alpha channel, and verify.
        // Actually, sharp's 'trim' works if border is uniform color.
        // Or we can use `threshold` mask if it's high contrast.
        // Let's try a robust method: Ensure alpha, then make near-white transparent.
        // "bandbool" logic is complex in sharp raw. 
        // Simpler approach: If logo is high contrast red on white, use 'ensureAlpha' and 'trim'.
        // If 'trim' fails (because of noise), we might need another way.
        // Let's try 'trim' first with a high threshold.

        await sharp(inputPath)
            .ensureAlpha()
            .trim({ threshold: 50 }) // Trim surrounding white space
            // If the inside is also white background, we might want to make white transparent...
            // Sharp doesn't have a direct "make color transparent" function easily without iterating pixels.
            // But we can use `toBuffer` and modify raw pixels.
            .toFile(tempPath);

        // Manual pixel iteration (safe and sure for "White -> Transparent")
        const { data, info } = await sharp(tempPath)
            .raw()
            .toBuffer({ resolveWithObject: true });

        const pixelArray = new Uint8Array(data);
        const sensitivity = 40; // 0-255 range for "near white"

        for (let i = 0; i < pixelArray.length; i += 4) {
            const r = pixelArray[i];
            const g = pixelArray[i + 1];
            const b = pixelArray[i + 2];

            // If pixel is near white
            if (r > 255 - sensitivity && g > 255 - sensitivity && b > 255 - sensitivity) {
                pixelArray[i + 3] = 0; // Alpha = 0
            }
        }

        await sharp(pixelArray, {
            raw: {
                width: info.width,
                height: info.height,
                channels: 4
            }
        })
            .png()
            .toFile(inputPath); // Overwrite original

        fs.unlinkSync(tempPath); // Clean temp
        console.log('✅ Logo processed successfully! White background removed.');

    } catch (error) {
        console.error('❌ Error processing logo:', error);
    }
}

processLogo();
