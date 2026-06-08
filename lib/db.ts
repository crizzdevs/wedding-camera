import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('localhost')
        ? false
        : { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function initDatabase() {
  const client = await getPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS photos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gcs_filename TEXT NOT NULL,
        uploaded_at TIMESTAMPTZ DEFAULT NOW(),
        session_id TEXT NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Seed gallery_revealed if not exists
    await client.query(`
      INSERT INTO settings (key, value)
      VALUES ('gallery_revealed', 'false')
      ON CONFLICT (key) DO NOTHING;
    `);
  } finally {
    client.release();
  }
}

export async function isGalleryRevealed(): Promise<boolean> {
  const { rows } = await getPool().query(
    "SELECT value FROM settings WHERE key = 'gallery_revealed'"
  );
  return rows[0]?.value === 'true';
}

export async function setGalleryRevealed(revealed: boolean) {
  await getPool().query(
    "UPDATE settings SET value = $1 WHERE key = 'gallery_revealed'",
    [revealed ? 'true' : 'false']
  );
}

export async function savePhoto(gcsFilename: string, sessionId: string) {
  const { rows } = await getPool().query(
    'INSERT INTO photos (gcs_filename, session_id) VALUES ($1, $2) RETURNING *',
    [gcsFilename, sessionId]
  );
  return rows[0];
}

export async function getAllPhotos() {
  const { rows } = await getPool().query(
    'SELECT * FROM photos ORDER BY uploaded_at DESC'
  );
  return rows;
}

export async function getPhotoCount(): Promise<number> {
  const { rows } = await getPool().query('SELECT COUNT(*) FROM photos');
  return parseInt(rows[0].count, 10);
}

export async function deletePhoto(id: string) {
  const { rows } = await getPool().query(
    'DELETE FROM photos WHERE id = $1 RETURNING *',
    [id]
  );
  return rows[0];
}
