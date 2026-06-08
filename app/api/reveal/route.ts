import { NextRequest, NextResponse } from 'next/server';
import { setGalleryRevealed } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const adminPassword = req.headers.get('x-admin-password');

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await setGalleryRevealed(true);
    return NextResponse.json({ success: true, revealed: true });
  } catch (err) {
    console.error('Reveal error:', err);
    return NextResponse.json({ error: 'Failed to reveal gallery' }, { status: 500 });
  }
}

// Optional: hide gallery again
export async function DELETE(req: NextRequest) {
  const adminPassword = req.headers.get('x-admin-password');
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await setGalleryRevealed(false);
    return NextResponse.json({ success: true, revealed: false });
  } catch (err) {
    console.error('Hide error:', err);
    return NextResponse.json({ error: 'Failed to hide gallery' }, { status: 500 });
  }
}
