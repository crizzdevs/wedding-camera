import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const adminPassword = req.headers.get('x-admin-password');
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initDatabase();
    return NextResponse.json({ success: true, message: 'Database initialized' });
  } catch (err) {
    console.error('DB init error:', err);
    return NextResponse.json({ error: 'Database initialization failed' }, { status: 500 });
  }
}
