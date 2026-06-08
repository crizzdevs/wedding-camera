import { NextRequest, NextResponse } from 'next/server';
import { uploadToGCS, deleteFromGCS } from '@/lib/gcs';
import { savePhoto, deletePhoto } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = getClientIp(req);
  const { allowed, remaining } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many uploads. Please try again later.' },
      {
        status: 429,
        headers: { 'X-RateLimit-Remaining': '0' },
      }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('photo') as File | null;
    const sessionId = (formData.get('session_id') as string) || 'anonymous';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // 10MB max
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large (max 10MB)' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name || `photo-${Date.now()}.jpg`;

    // Upload to GCS
    const gcsPath = await uploadToGCS(buffer, filename, file.type);

    // Save to DB
    const photo = await savePhoto(gcsPath, sessionId);

    return NextResponse.json(
      {
        success: true,
        id: photo.id,
        message: 'Photo uploaded successfully',
      },
      { headers: { 'X-RateLimit-Remaining': remaining.toString() } }
    );
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  // Admin only
  const adminPassword = req.headers.get('x-admin-password');
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const gcs = searchParams.get('gcs');

  if (!id || !gcs) {
    return NextResponse.json({ error: 'Missing id or gcs param' }, { status: 400 });
  }

  try {
    await deleteFromGCS(gcs);
    await deletePhoto(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
