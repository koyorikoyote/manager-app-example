import { google } from "googleapis";
import { Readable } from "stream";
import path from "path";

// Parent folder IDs resolved from env
const IMG_FOLDER_ID = process.env.GOOGLE_DRIVE_IMG_FOLDER_ID;
const DOC_FOLDER_ID = process.env.GOOGLE_DRIVE_DOC_FOLDER_ID;

function getDriveClient() {
    const credJson = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
    if (credJson) {
        const credentials = JSON.parse(credJson);
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ["https://www.googleapis.com/auth/drive"],
        });
        return google.drive({ version: "v3", auth });
    }
    // Fallback: key file (local dev)
    const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
    if (!keyFile) {
        throw new Error(
            "Google Drive not configured. Set GOOGLE_SERVICE_ACCOUNT_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_KEY_FILE."
        );
    }
    const absoluteKeyFile = path.resolve(process.cwd(), keyFile);
    const auth = new google.auth.GoogleAuth({
        keyFile: absoluteKeyFile,
        scopes: ["https://www.googleapis.com/auth/drive"],
    });
    return google.drive({ version: "v3", auth });
}


/** Given a contentType, returns the target Drive folder ID */
function resolveFolderId(contentType: string): string {
    const isImage = contentType.startsWith("image/");
    const folderId = isImage ? IMG_FOLDER_ID : DOC_FOLDER_ID;
    if (!folderId) {
        throw new Error(
            `Google Drive folder ID not configured for ${isImage ? "images" : "documents"}. ` +
            `Set ${isImage ? "GOOGLE_DRIVE_IMG_FOLDER_ID" : "GOOGLE_DRIVE_DOC_FOLDER_ID"} in your environment.`
        );
    }
    return folderId;
}

/** Returns a public display URL for a Drive file */
export function getDrivePublicUrl(fileId: string, contentType: string): string {
    if (contentType.startsWith("image/")) {
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    return `https://drive.google.com/file/d/${fileId}/view`;
}

/** Extracts a Drive file ID from a stored URL, or returns the value as-is if it's already just an ID */
export function fileIdFromUrl(urlOrId: string): string | null {
    if (!urlOrId) return null;
    // Match /uc?...id=FILE_ID or /file/d/FILE_ID/
    const patterns = [
        /[?&]id=([a-zA-Z0-9_-]+)/,
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
    ];
    for (const pattern of patterns) {
        const match = urlOrId.match(pattern);
        if (match) return match[1];
    }
    // Assume it's a raw file ID
    if (/^[a-zA-Z0-9_-]{20,}$/.test(urlOrId)) return urlOrId;
    return null;
}

/**
 * Upload a buffer to Google Drive and return the public view URL.
 */
export async function uploadBufferToDrive(params: {
    buffer: Buffer;
    contentType: string;
    filename: string;
}): Promise<string> {
    const { buffer, contentType, filename } = params;
    const folderId = resolveFolderId(contentType);
    const drive = getDriveClient();

    const stream = Readable.from(buffer);

    const file = await drive.files.create({
        requestBody: {
            name: filename,
            parents: [folderId],
        },
        media: {
            mimeType: contentType,
            body: stream,
        },
        fields: "id",
        supportsAllDrives: true,
    });

    const fileId = file.data.id;
    if (!fileId) {
        throw new Error("Google Drive upload returned no file ID.");
    }

    // Make publicly readable
    await drive.permissions.create({
        fileId,
        requestBody: {
            role: "reader",
            type: "anyone",
        },
        supportsAllDrives: true,
    });

    return getDrivePublicUrl(fileId, contentType);
}

/**
 * Delete (trash) a file from Google Drive by URL or file ID. Idempotent.
 */
export async function deleteFileFromDrive(urlOrId: string): Promise<boolean> {
    const fileId = fileIdFromUrl(urlOrId);
    if (!fileId) return false;
    try {
        const drive = getDriveClient();
        await drive.files.update({
            fileId,
            requestBody: { trashed: true },
            supportsAllDrives: true,
        });
        return true;
    } catch {
        return false;
    }
}
