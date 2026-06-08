import { Storage } from '@google-cloud/storage';

let storageInstance: Storage | null = null;

export function getStorage(): Storage {
  if (!storageInstance) {
    const credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON || '{}');
    storageInstance = new Storage({ credentials });
  }
  return storageInstance;
}

export function getBucket() {
  return getStorage().bucket(process.env.GCS_BUCKET_NAME!);
}

export async function uploadToGCS(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const bucket = getBucket();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const gcsPath = `photos/${Date.now()}-${sanitizedFilename}`;
  const blob = bucket.file(gcsPath);

  await new Promise<void>((resolve, reject) => {
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType,
    });
    blobStream.on('error', reject);
    blobStream.on('finish', resolve);
    blobStream.end(buffer);
  });

  return gcsPath;
}

export async function getSignedUrl(gcsPath: string): Promise<string> {
  const bucket = getBucket();
  const blob = bucket.file(gcsPath);
  const [url] = await blob.getSignedUrl({
    action: 'read',
    expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });
  return url;
}

export async function deleteFromGCS(gcsPath: string): Promise<void> {
  const bucket = getBucket();
  await bucket.file(gcsPath).delete({ ignoreNotFound: true });
}
