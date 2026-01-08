import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Centralized S3 helper for uploads and URL generation.
 * Assumes IAM role on EB grants access to the bucket in S3_BUCKET_NAME.
 */

const REGION = process.env.AWS_REGION || "ap-northeast-1";
const BUCKET = process.env.S3_BUCKET_NAME;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

/**
 * Lazily constructed S3 client
 */
export const s3Client = new S3Client({
  region: REGION,
});

/**
 * Build public URL for a given S3 object key using CloudFront if available,
 * otherwise fall back to S3 HTTPS URL.
 */
export function getPublicUrlForKey(key: string): string {
  const cleanKey = key.replace(/^\/+/, "");
  if (CLOUDFRONT_DOMAIN) {
    return `https://${CLOUDFRONT_DOMAIN}/${cleanKey}`;
  }
  if (!BUCKET) {
    // As a last resort, return a non-functional dummy URL (used in local/dev seeding with no envs)
    return `https://example-bucket.s3.${REGION}.amazonaws.com/${cleanKey}`;
  }
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${cleanKey}`;
}

/**
 * Upload a buffer to S3 at the specified key and return a public URL
 */
export async function uploadBufferToS3(params: {
  key: string;
  buffer: Buffer;
  contentType?: string;
}): Promise<string> {
  if (!BUCKET) {
    throw new Error("S3_BUCKET_NAME is not set in environment.");
  }
  const key = params.key.replace(/^\/+/, "");
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: params.buffer,
      ContentType: params.contentType || "application/octet-stream",
    })
  );
  return getPublicUrlForKey(key);
}

/**
 * Generate a pre-signed PUT URL so clients (mobile/web) can upload directly to S3.
 * Returns the URL, headers to include, and the publicly resolvable URL (via CloudFront if configured).
 */
export async function getPresignedPutUrl(params: {
  key: string;
  contentType?: string;
  expiresIn?: number; // seconds (default 300s = 5min)
}): Promise<{
  url: string;
  key: string;
  headers: Record<string, string>;
  publicUrl: string;
}> {
  if (!BUCKET) {
    throw new Error("S3_BUCKET_NAME is not set in environment.");
  }
  const key = params.key.replace(/^\/+/, "");
  const contentType = params.contentType || "application/octet-stream";
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(s3Client, command, {
    expiresIn: params.expiresIn ?? 300,
  });
  const publicUrl = getPublicUrlForKey(key);
  return {
    url,
    key,
    headers: { "Content-Type": contentType },
    publicUrl,
  };
}

/**
 * Delete an object from S3 by its key
 */
export async function deleteObjectFromS3(key: string): Promise<boolean> {
  if (!BUCKET) {
    return false;
  }
  const cleanKey = key.replace(/^\/+/, "");
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: cleanKey,
    })
  );
  return true;
}

/**
 * Extract an S3 object key from either a full URL or a relative path.
 * Ensures the returned key is in the "uploads/..." namespace required by our CloudFront behavior.
 */
export function keyFromUrlOrPath(urlOrPath: string): string {
  try {
    // If it&#x27;s a full URL, parse and take pathname
    const u = new URL(urlOrPath);
    const pathName = u.pathname.replace(/^\/+/, "");
    if (pathName.startsWith("uploads/")) return pathName;
    return `uploads/${pathName}`;
  } catch {
    // Not a URL, treat it as relative path
    const p = urlOrPath.replace(/^\/+/, "");
    if (p.startsWith("uploads/")) return p;
    return `uploads/${p}`;
  }
}
