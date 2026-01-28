import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return new NextResponse('URL is required', { status: 400 });
    }

    try {
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': '' // Referer를 비워서 차단 우회
            },
            timeout: 5000
        });

        const contentType = response.headers['content-type'];
        return new NextResponse(response.data, {
            headers: {
                'Content-Type': contentType || 'image/jpeg',
                'Cache-Control': 'public, max-age=86400, s-maxage=86400'
            }
        });
    } catch (error: any) {
        console.error('Image proxy error:', error.message);
        return new NextResponse('Error fetching image', { status: 500 });
    }
}
