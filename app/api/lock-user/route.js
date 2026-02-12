import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });
        }

        if (process.env.KV_REST_API_URL) {
            await kv.set(`user:${id}:locked`, 'true');
        } else {
            // console.warn('KV not configured, skipping lock');
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('KV Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}
