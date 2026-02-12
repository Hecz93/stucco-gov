import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ allowed: false, error: 'Missing ID' }, { status: 400 });
    }

    try {
        // Check if user is locked
        // If KV is not configured, we'll just allow everything for demo/dev purposes
        if (!process.env.KV_REST_API_URL) {
            // console.warn('KV not configured, allowing all');
            return NextResponse.json({ allowed: true });
        }

        const isLocked = await kv.get(`user:${id}:locked`);
        return NextResponse.json({ allowed: !isLocked });
    } catch (error) {
        console.error('KV Error:', error);
        // Fail open for better UX
        return NextResponse.json({ allowed: true });
    }
}
