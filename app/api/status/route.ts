import { NextResponse } from 'next/server';
import { isGalleryRevealed } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const revealed = await isGalleryRevealed();
    return NextResponse.json({ revealed });
  } catch (err) {
    console.error('Status error:', err);
    return NextResponse.json({ revealed: false });
  }
}
