import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export interface PhotoFileInfo {
  originalPath: string;
  processedPath: string;
  filename: string;
  size: number;
}

/**
 * Generate unique filename with proper naming convention
 */
export const generatePhotoFilename = (
  prefix: string,
  originalFilename: string,
  extension?: string
): string => {
  const uniqueId = uuidv4();
  const timestamp = Date.now();

  // Extract original name without extension for reference
  const originalName = path.parse(originalFilename).name;
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9-_]/g, "");

  // Use provided extension or extract from original filename
  const ext = extension || path.extname(originalFilename).toLowerCase();
  const finalExt = ext.startsWith(".") ? ext.substring(1) : ext;

  return `${prefix}-${timestamp}-${uniqueId}${sanitizedName ? `-${sanitizedName}` : ""
    }.${finalExt}`;
};

/**
 * Process uploaded photo file (copy to destination with proper naming)
 */
export const processPhotoFile = async (
  inputPath: string,
  outputPath: string
): Promise<PhotoFileInfo> => {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Copy file to destination
    await fs.copyFile(inputPath, outputPath);

    // Get file stats
    const stats = await fs.stat(outputPath);

    return {
      originalPath: inputPath,
      processedPath: outputPath,
      filename: path.basename(outputPath),
      size: stats.size,
    };
  } catch (error) {
    // Clean up output file if it was created
    try {
      await fs.unlink(outputPath);
    } catch { }

    throw new Error(
      `Photo processing failed: ${error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Process uploaded photo for daily records
 */
export const processDailyRecordPhoto = async (
  uploadedFilePath: string,
  originalFilename: string
): Promise<PhotoFileInfo> => {
  const outputDir = path.join(process.cwd(), "uploads", "daily-records");
  const filename = generatePhotoFilename("daily-record", originalFilename);
  const outputPath = path.join(outputDir, filename);

  return processPhotoFile(uploadedFilePath, outputPath);
};

/**
 * Process uploaded photo for staff profiles
 */
export const processStaffPhoto = async (
  uploadedFilePath: string,
  originalFilename: string,
  staffId: number
): Promise<PhotoFileInfo> => {
  const outputDir = path.join(process.cwd(), "uploads", "staff-photos");
  const filename = generatePhotoFilename(`staff-${staffId}`, originalFilename);
  const outputPath = path.join(outputDir, filename);

  return processPhotoFile(uploadedFilePath, outputPath);
};

/**
 * Delete photo file safely
 */
export const deletePhotoFile = async (photoPath: string): Promise<boolean> => {
  try {
    // Ensure the path is within the uploads directory for security
    const uploadsDir = path.join(process.cwd(), "uploads");
    const fullPath = path.resolve(
      photoPath.startsWith("/")
        ? path.join(process.cwd(), photoPath.substring(1))
        : photoPath
    );

    if (!fullPath.startsWith(uploadsDir)) {
      console.warn(
        `Attempted to delete file outside uploads directory: ${fullPath}`
      );
      return false;
    }

    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    console.warn(`Failed to delete photo file: ${photoPath}`, error);
    return false;
  }
};

/**
 * Clean up orphaned photo files
 */
export const cleanupOrphanedPhotos = async (
  directory: "daily-records" | "staff-photos",
  validPhotoPaths: string[]
): Promise<{ deleted: string[]; errors: string[] }> => {
  const deleted: string[] = [];
  const errors: string[] = [];

  try {
    const uploadDir = path.join(process.cwd(), "uploads", directory);

    // Check if directory exists
    try {
      await fs.access(uploadDir);
    } catch {
      return { deleted, errors };
    }

    const files = await fs.readdir(uploadDir);

    // Convert valid paths to just filenames for comparison
    const validFilenames = validPhotoPaths
      .map((photoPath) => path.basename(photoPath))
      .filter((filename) => filename && filename !== "");

    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      const stats = await fs.stat(filePath);

      // Skip directories
      if (stats.isDirectory()) {
        continue;
      }

      // Check if file is referenced in database
      if (!validFilenames.includes(file)) {
        try {
          await fs.unlink(filePath);
          deleted.push(file);
        } catch (error) {
          errors.push(
            `Failed to delete ${file}: ${error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }
    }
  } catch (error) {
    errors.push(
      `Failed to cleanup directory ${directory}: ${error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  return { deleted, errors };
};

/**
 * Validate image file basic properties
 */
export const validateImageFile = async (
  filePath: string
): Promise<{
  isValid: boolean;
  error?: string;
  metadata?: {
    size: number;
    extension: string;
  };
}> => {
  try {
    const stats = await fs.stat(filePath);
    const extension = path.extname(filePath).toLowerCase();

    // Check file extension
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    if (!allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `Invalid file type. Allowed types: ${allowedExtensions.join(
          ", "
        )}`,
      };
    }

    // Check file size (10MB limit)
    if (stats.size > 10 * 1024 * 1024) {
      return {
        isValid: false,
        error: "File size too large (maximum 10MB)",
      };
    }

    // Check minimum file size (1KB to ensure it's not empty)
    if (stats.size < 1024) {
      return {
        isValid: false,
        error: "File size too small (minimum 1KB)",
      };
    }

    return {
      isValid: true,
      metadata: {
        size: stats.size,
        extension,
      },
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Failed to validate file: ${error instanceof Error ? error.message : "Unknown error"
        }`,
    };
  }
};

/**
 * Get photo file information
 */
export const getPhotoInfo = async (
  photoPath: string
): Promise<{
  exists: boolean;
  size?: number;
  extension?: string;
}> => {
  try {
    const fullPath = photoPath.startsWith("/")
      ? path.join(process.cwd(), photoPath.substring(1))
      : photoPath;

    const stats = await fs.stat(fullPath);
    const extension = path.extname(fullPath).toLowerCase();

    return {
      exists: true,
      size: stats.size,
      extension,
    };
  } catch {
    return { exists: false };
  }
};

/**
 * Move temporary uploaded file to permanent location
 */
export const moveUploadedFile = async (
  tempPath: string,
  permanentPath: string
): Promise<PhotoFileInfo> => {
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(permanentPath);
    await fs.mkdir(destDir, { recursive: true });

    // Move file
    await fs.rename(tempPath, permanentPath);

    // Get file stats
    const stats = await fs.stat(permanentPath);

    return {
      originalPath: tempPath,
      processedPath: permanentPath,
      filename: path.basename(permanentPath),
      size: stats.size,
    };
  } catch (error) {
    // Clean up files on error
    try {
      await fs.unlink(tempPath);
    } catch { }
    try {
      await fs.unlink(permanentPath);
    } catch { }

    throw new Error(
      `Failed to move uploaded file: ${error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Create backup of existing photo before replacement
 */
export const backupExistingPhoto = async (
  photoPath: string
): Promise<string | null> => {
  try {
    const fullPath = photoPath.startsWith("/")
      ? path.join(process.cwd(), photoPath.substring(1))
      : photoPath;

    // Check if file exists
    await fs.access(fullPath);

    // Create backup filename
    const parsedPath = path.parse(fullPath);
    const backupPath = path.join(
      parsedPath.dir,
      `${parsedPath.name}-backup-${Date.now()}${parsedPath.ext}`
    );

    // Copy to backup location
    await fs.copyFile(fullPath, backupPath);

    return backupPath;
  } catch {
    // File doesn't exist or backup failed
    return null;
  }
};

/**
 * Restore photo from backup
 */
export const restorePhotoFromBackup = async (
  originalPath: string,
  backupPath: string
): Promise<boolean> => {
  try {
    await fs.copyFile(backupPath, originalPath);
    await fs.unlink(backupPath); // Clean up backup
    return true;
  } catch {
    return false;
  }
};
