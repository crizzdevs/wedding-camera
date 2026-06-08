import { NextRequest, NextResponse } from 'next/server';
import { getAllPhotos, isGalleryRevealed, getPhotoCount } from '@/lib/db';
import { getSignedUrl } from '@/lib/gcs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Extract parameters from the URL safely
  const url = new URL(req.url);
  const adminParam = url.searchParams.get('admin') === 'true';
  const passwordParam = url.searchParams.get('pass');

  // Check if the password parameter matches the environment variable
  const isAdmin = passwordParam === process.env.ADMIN_PASSWORD;

  // Admin access: return all photos regardless of reveal status
  if (isAdmin && adminParam) {
    try {
      const photos = await getAllPhotos();
      const count = await getPhotoCount();
      const revealed = await isGalleryRevealed();

      const photosWithUrls = await Promise.all(
        photos.map(async (photo) => ({
          ...photo,
          signedUrl: await getSignedUrl(photo.gcs_filename),
        }))
      );

      return NextResponse.json({ photos: photosWithUrls, count, revealed });
    } catch (err) {
      console.error('Gallery admin error:', err);
      return NextResponse.json({ error: 'Failed to load gallery' }, { status: 500 });
    }
  }

  // Public access: only if revealed
  try {
    const revealed = await isGalleryRevealed();

    if (!revealed) {
      return NextResponse.json({ locked: true, revealed: false }, { status: 200 });
    }

    const photos = await getAllPhotos();
    const photosWithUrls = await Promise.all(
      photos.map(async (photo) => ({
        id: photo.id,
        uploaded_at: photo.uploaded_at,
        session_id: photo.session_id,
        signedUrl: await getSignedUrl(photo.gcs_filename),
      }))
    );

    return NextResponse.json({ photos: photosWithUrls, revealed: true });
  } catch (err) {
    console.error('Gallery error:', err);
    return NextResponse.json({ error: 'Failed to load gallery' }, { status: 500 });
  }
}