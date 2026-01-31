import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'src', 'data', 'offline_places.json');
        if (!fs.existsSync(filePath)) {
            return NextResponse.json([]);
        }
        const data = fs.readFileSync(filePath, 'utf-8');
        return NextResponse.json(JSON.parse(data));
    } catch (e) {
        return NextResponse.json({ error: 'Failed to load offline data' }, { status: 500 });
    }
}
