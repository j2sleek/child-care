import { S3Client, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../config/env.ts';

function isS3Configured(): boolean {
  return !!(env.S3_BUCKET_NAME && env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY);
}

function getClient(): S3Client {
  if (!isS3Configured()) {
    throw Object.assign(new Error('S3 is not configured'), { statusCode: 503, code: 'S3_UNAVAILABLE' });
  }
  return new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

export function getPublicUrl(key: string): string {
  return `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * Returns a presigned PUT URL the client uploads directly to S3.
 * Allowed MIME types are restricted to images only.
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(contentType)) {
    throw Object.assign(
      new Error(`Unsupported content type. Allowed: ${allowed.join(', ')}`),
      { statusCode: 400, code: 'INVALID_CONTENT_TYPE' },
    );
  }

  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: env.S3_PRESIGN_EXPIRES_SECONDS,
  });

  return { uploadUrl, publicUrl: getPublicUrl(key) };
}

export async function deleteObject(key: string): Promise<void> {
  if (!isS3Configured()) return; // no-op if S3 not configured
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET_NAME, Key: key }));
}
