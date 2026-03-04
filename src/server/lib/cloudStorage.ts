import { Storage } from "@google-cloud/storage";
import path from "path";

const BUCKET_NAME = process.env.GCS_BUCKET_NAME ?? "";

function getStorageClient(): Storage {
    const credJson = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
    if (credJson) {
        return new Storage({ credentials: JSON.parse(credJson) });
    }
    const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (keyFile) {
        return new Storage({ keyFilename: path.resolve(process.cwd(), keyFile) });
    }
    // Cloud Run: use Application Default Credentials automatically
    return new Storage();
}

/** Returns the public URL for a GCS object */
export function getStoragePublicUrl(objectName: string): string {
    return `https://storage.googleapis.com/${BUCKET_NAME}/${objectName}`;
}

/** Extracts the GCS object key from a stored public URL */
export function fileKeyFromUrl(url: string): string | null {
    if (!url) return null;
    const prefix = `https://storage.googleapis.com/${BUCKET_NAME}/`;
    if (url.startsWith(prefix)) return url.slice(prefix.length);
    return null;
}

/** Keeps the old name working as an alias (used in several routes) */
export function fileIdFromUrl(url: string): string | null {
    return fileKeyFromUrl(url);
}

/**
 * Upload a buffer to GCS and return the public URL.
 */
export async function uploadBufferToStorage(params: {
    buffer: Buffer;
    contentType: string;
    filename: string;
}): Promise<string> {
    const { buffer, contentType, filename } = params;
    if (!BUCKET_NAME) {
        throw new Error(
            "GCS not configured. Set GCS_BUCKET_NAME in your environment."
        );
    }
    const storage = getStorageClient();
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(filename);

    await file.save(buffer, {
        contentType,
        metadata: { cacheControl: "public, max-age=31536000" },
    });

    return getStoragePublicUrl(filename);
}

/** Alias kept for callers that used the Drive name */
export const uploadBufferToDrive = uploadBufferToStorage;

/**
 * Delete a file from GCS by URL or object key. Idempotent.
 */
export async function deleteFileFromStorage(urlOrKey: string): Promise<boolean> {
    const key = fileKeyFromUrl(urlOrKey) ?? urlOrKey;
    if (!key || !BUCKET_NAME) return false;
    try {
        const storage = getStorageClient();
        await storage.bucket(BUCKET_NAME).file(key).delete({ ignoreNotFound: true });
        return true;
    } catch {
        return false;
    }
}

/** Alias kept for callers that used the Drive name */
export const deleteFileFromDrive = deleteFileFromStorage;
