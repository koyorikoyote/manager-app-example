// Enhanced photo validation utilities for daily records and other photo uploads

export interface PhotoValidationResult {
  isValid: boolean;
  error?: string;
  fileSize?: number;
  dimensions?: { width: number; height: number };
  fileType?: string;
}

export interface PhotoValidationOptions {
  maxFileSize?: number; // in bytes
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  allowedTypes?: string[];
  requireSquare?: boolean;
}

// Default validation options for daily record photos
export const DAILY_RECORD_PHOTO_OPTIONS: PhotoValidationOptions = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  minWidth: 100,
  minHeight: 100,
  maxWidth: 4000,
  maxHeight: 4000,
  allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  requireSquare: false,
};

// Default validation options for staff photos
export const STAFF_PHOTO_OPTIONS: PhotoValidationOptions = {
  maxFileSize: 2 * 1024 * 1024, // 2MB
  minWidth: 150,
  minHeight: 150,
  maxWidth: 2000,
  maxHeight: 2000,
  allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  requireSquare: false,
};

/**
 * Validates a photo file with comprehensive checks
 */
export const validatePhoto = (
  file: File | null | undefined,
  options: PhotoValidationOptions = DAILY_RECORD_PHOTO_OPTIONS
): Promise<PhotoValidationResult> => {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ isValid: true }); // Optional field
      return;
    }

    // Check file size
    if (options.maxFileSize && file.size > options.maxFileSize) {
      resolve({
        isValid: false,
        error: `File size too large. Maximum allowed: ${formatFileSize(
          options.maxFileSize
        )}`,
        fileSize: file.size,
        fileType: file.type,
      });
      return;
    }

    // Check file type
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      resolve({
        isValid: false,
        error: `Invalid file type. Allowed types: ${options.allowedTypes.join(
          ", "
        )}`,
        fileSize: file.size,
        fileType: file.type,
      });
      return;
    }

    // Check if it's actually an image by trying to load it
    const img = new window.Image();

    img.onload = () => {
      const dimensions = { width: img.width, height: img.height };

      // Check minimum dimensions
      if (
        (options.minWidth && dimensions.width < options.minWidth) ||
        (options.minHeight && dimensions.height < options.minHeight)
      ) {
        resolve({
          isValid: false,
          error: `Image too small. Minimum size: ${options.minWidth || 0}x${
            options.minHeight || 0
          } pixels`,
          dimensions,
          fileSize: file.size,
          fileType: file.type,
        });
        return;
      }

      // Check maximum dimensions
      if (
        (options.maxWidth && dimensions.width > options.maxWidth) ||
        (options.maxHeight && dimensions.height > options.maxHeight)
      ) {
        resolve({
          isValid: false,
          error: `Image too large. Maximum size: ${
            options.maxWidth || "unlimited"
          }x${options.maxHeight || "unlimited"} pixels`,
          dimensions,
          fileSize: file.size,
          fileType: file.type,
        });
        return;
      }

      // Check if square is required
      if (options.requireSquare && dimensions.width !== dimensions.height) {
        resolve({
          isValid: false,
          error: "Image must be square (equal width and height)",
          dimensions,
          fileSize: file.size,
          fileType: file.type,
        });
        return;
      }

      // All validations passed
      resolve({
        isValid: true,
        dimensions,
        fileSize: file.size,
        fileType: file.type,
      });

      // Clean up object URL
      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      resolve({
        isValid: false,
        error: "Invalid or corrupted image file",
        fileSize: file.size,
        fileType: file.type,
      });
      URL.revokeObjectURL(img.src);
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Validates photo file type without loading the image
 */
export const validatePhotoType = (
  file: File | null | undefined,
  allowedTypes: string[] = DAILY_RECORD_PHOTO_OPTIONS.allowedTypes!
): PhotoValidationResult => {
  if (!file) {
    return { isValid: true }; // Optional field
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
      fileSize: file.size,
      fileType: file.type,
    };
  }

  return {
    isValid: true,
    fileSize: file.size,
    fileType: file.type,
  };
};

/**
 * Validates photo file size
 */
export const validatePhotoSize = (
  file: File | null | undefined,
  maxSize: number = DAILY_RECORD_PHOTO_OPTIONS.maxFileSize!
): PhotoValidationResult => {
  if (!file) {
    return { isValid: true }; // Optional field
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size too large. Maximum allowed: ${formatFileSize(maxSize)}`,
      fileSize: file.size,
      fileType: file.type,
    };
  }

  return {
    isValid: true,
    fileSize: file.size,
    fileType: file.type,
  };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Get user-friendly error messages for common validation scenarios
 */
export const getPhotoValidationErrorMessage = (
  error: string,
  context: "daily_record" | "staff" = "daily_record"
): string => {
  const contextMessages = {
    daily_record: {
      size: "Daily record photos must be under 5MB",
      type: "Please upload a JPEG, PNG, or WebP image for the daily record",
      dimensions:
        "Daily record photos must be at least 100x100 pixels and no larger than 4000x4000 pixels",
      corrupted:
        "The uploaded daily record photo appears to be corrupted. Please try a different image",
    },
    staff: {
      size: "Staff photos must be under 2MB",
      type: "Please upload a JPEG, PNG, or WebP image for the staff photo",
      dimensions:
        "Staff photos must be at least 150x150 pixels and no larger than 2000x2000 pixels",
      corrupted:
        "The uploaded staff photo appears to be corrupted. Please try a different image",
    },
  };

  if (error.includes("size")) {
    return contextMessages[context].size;
  }
  if (error.includes("type")) {
    return contextMessages[context].type;
  }
  if (
    error.includes("dimensions") ||
    error.includes("small") ||
    error.includes("large")
  ) {
    return contextMessages[context].dimensions;
  }
  if (error.includes("corrupted") || error.includes("Invalid")) {
    return contextMessages[context].corrupted;
  }

  return error; // Return original error if no specific match
};

/**
 * Validate photo URL/path string
 */
export const validatePhotoPath = (
  path: string | null | undefined,
  maxLength: number = 500
): { isValid: boolean; error?: string } => {
  if (!path || path.trim() === "") {
    return { isValid: true }; // Optional field
  }

  if (path.length > maxLength) {
    return {
      isValid: false,
      error: `Photo path too long. Maximum ${maxLength} characters allowed`,
    };
  }

  // Basic URL/path validation
  const validPathRegex = /^[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+$/;
  if (!validPathRegex.test(path)) {
    return {
      isValid: false,
      error: "Invalid photo path format",
    };
  }

  return { isValid: true };
};
