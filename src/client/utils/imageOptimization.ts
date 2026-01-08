// Image optimization utilities for better performance

/* eslint-env browser */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "jpeg" | "webp" | "png";
  maxSizeKB?: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

// Default compression settings optimized for company photos
export const DEFAULT_COMPRESSION_OPTIONS: ImageCompressionOptions = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.85,
  format: "jpeg",
  maxSizeKB: 500, // 500KB target size
};

// Helpers to ensure a Blob is produced even if canvas.toBlob returns null
const dataURLToBlob = (dataURL: string): Blob => {
  const parts = dataURL.split(",");
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const bstr = (
    typeof globalThis !== "undefined" && (globalThis as any).atob
      ? (globalThis as any).atob
      : (_s: string) => {
          throw new Error("atob not available in this environment");
        }
  )(parts[1]);
  const len = bstr.length;
  const u8arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) u8arr[i] = bstr.charCodeAt(i);
  return new Blob([u8arr], { type: mime });
};

const toBlobSafe = (
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> => {
  return new Promise<Blob>((resolve) => {
    if (typeof canvas.toBlob === "function") {
      canvas.toBlob(
        (b) => {
          if (b) {
            resolve(b);
          } else {
            const dataUrl = canvas.toDataURL(type, quality);
            resolve(dataURLToBlob(dataUrl));
          }
        },
        type,
        quality
      );
    } else {
      const dataUrl = canvas.toDataURL(type, quality);
      resolve(dataURLToBlob(dataUrl));
    }
  });
};

// Safe Image constructor helper
const createImageEl = (): HTMLImageElement => {
  const Ctor =
    typeof globalThis !== "undefined" ? (globalThis as any).Image : undefined;
  if (Ctor) return new Ctor();
  throw new Error("Image constructor not available in this environment");
};

// WebP support detection with caching
let webpSupported: boolean | null = null;

export const supportsWebP = (): Promise<boolean> => {
  if (webpSupported !== null) {
    return Promise.resolve(webpSupported);
  }

  return new Promise((resolve) => {
    let webp: HTMLImageElement | null = null;
    try {
      webp = createImageEl();
    } catch {
      resolve(false);
      return;
    }
    webp.onload = webp.onerror = () => {
      webpSupported = webp!.height === 2;
      resolve(webpSupported);
    };
    webp.src =
      "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";
  });
};

// Calculate optimal dimensions while maintaining aspect ratio
export const calculateOptimalDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): ImageDimensions => {
  let { width, height } = { width: originalWidth, height: originalHeight };
  const aspectRatio = width / height;

  // Only resize if image is larger than max dimensions
  if (width > maxWidth || height > maxHeight) {
    if (aspectRatio > 1) {
      // Landscape orientation
      width = Math.min(width, maxWidth);
      height = width / aspectRatio;

      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
    } else {
      // Portrait orientation
      height = Math.min(height, maxHeight);
      width = height * aspectRatio;

      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
    }
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
};

// Progressive quality reduction to meet size target
export const compressToTargetSize = async (
  canvas: HTMLCanvasElement,
  targetSizeKB: number,
  format: string = "image/jpeg",
  initialQuality: number = 0.9
): Promise<Blob> => {
  let quality = initialQuality;
  const minQuality = 0.3;
  const qualityStep = 0.1;

  while (quality >= minQuality) {
    const attempt = await toBlobSafe(canvas, format, quality);
    if (attempt.size <= targetSizeKB * 1024) {
      return attempt;
    }
    quality -= qualityStep;
  }

  // Fallback with minimum quality
  return toBlobSafe(canvas, format, minQuality);
};

// Main image compression function with progressive optimization
export const compressImage = async (
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> => {
  const opts = { ...DEFAULT_COMPRESSION_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    let img: HTMLImageElement;
    try {
      img = createImageEl();
    } catch {
      reject(new Error("Image constructor not available"));
      return;
    }

    img.onload = async () => {
      const ctx2 = canvas.getContext("2d");
      if (!ctx2) {
        reject(new Error("Canvas context not available"));
        return;
      }
      try {
        // Calculate optimal dimensions
        const dimensions = calculateOptimalDimensions(
          img.width,
          img.height,
          opts.maxWidth!,
          opts.maxHeight!
        );

        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        // Use high-quality scaling
        ctx2.imageSmoothingEnabled = true;
        (ctx2 as CanvasRenderingContext2D).imageSmoothingQuality = "high";

        // Draw image with optimal dimensions
        ctx2.drawImage(img, 0, 0, dimensions.width, dimensions.height);

        // Determine optimal format
        let format = `image/${opts.format}`;
        if (opts.format === "webp") {
          const webpSupport = await supportsWebP();
          if (!webpSupport) {
            format = "image/jpeg";
          }
        }

        // Compress to target size if specified
        let blob: Blob;
        if (opts.maxSizeKB) {
          blob = await compressToTargetSize(
            canvas,
            opts.maxSizeKB,
            format,
            opts.quality
          );
        } else {
          blob = await toBlobSafe(canvas, format, opts.quality);
        }

        // Create optimized file
        const optimizedFile = new File([blob], file.name, {
          type: blob.type,
          lastModified: Date.now(),
        });

        resolve(optimizedFile);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for compression"));
    };

    // Create object URL for better memory management
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    // Clean up object URL after image loads
    const originalOnLoad = img.onload;
    img.onload = function (ev: Event) {
      URL.revokeObjectURL(objectUrl);
      if (originalOnLoad) {
        return originalOnLoad.call(this, ev);
      }
    };
  });
};

// Batch image compression for multiple files
export const compressImages = async (
  files: File[],
  options: ImageCompressionOptions = {}
): Promise<File[]> => {
  const compressionPromises = files.map((file) => compressImage(file, options));
  return Promise.all(compressionPromises);
};

// Image validation with detailed error reporting
export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  dimensions?: ImageDimensions;
  fileSize?: number;
}

export const validateImage = (file: File): Promise<ImageValidationResult> => {
  return new Promise((resolve) => {
    let img: HTMLImageElement;
    try {
      img = createImageEl();
    } catch {
      // In non-browser environments, validation cannot proceed
      resolve({
        isValid: false,
        error: "Image API not available",
        fileSize: file.size,
      });
      return;
    }

    img.onload = () => {
      const dimensions = { width: img.width, height: img.height };

      // Check minimum dimensions
      if (dimensions.width < 100 || dimensions.height < 100) {
        resolve({
          isValid: false,
          error: "Image dimensions too small (minimum 100x100 pixels)",
          dimensions,
          fileSize: file.size,
        });
        return;
      }

      // Check maximum dimensions
      if (dimensions.width > 4000 || dimensions.height > 4000) {
        resolve({
          isValid: false,
          error: "Image dimensions too large (maximum 4000x4000 pixels)",
          dimensions,
          fileSize: file.size,
        });
        return;
      }

      resolve({
        isValid: true,
        dimensions,
        fileSize: file.size,
      });
    };

    img.onerror = () => {
      resolve({
        isValid: false,
        error: "Invalid or corrupted image file",
        fileSize: file.size,
      });
    };

    img.src = URL.createObjectURL(file);
  });
};

// Generate responsive image sizes for different screen densities
export const generateResponsiveImages = async (
  file: File,
  sizes: number[] = [400, 800, 1200]
): Promise<{ size: number; file: File }[]> => {
  const results: { size: number; file: File }[] = [];

  for (const size of sizes) {
    const options: ImageCompressionOptions = {
      maxWidth: size,
      maxHeight: size,
      quality: 0.85,
      format: "webp",
    };

    try {
      const compressedFile = await compressImage(file, options);
      results.push({ size, file: compressedFile });
    } catch (error) {
      console.warn(`Failed to generate ${size}px version:`, error);
    }
  }

  return results;
};

// Memory-efficient image preview generation
export const generateImagePreview = (
  file: File,
  maxSize: number = 200
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    let img: HTMLImageElement;
    try {
      img = createImageEl();
    } catch {
      reject(new Error("Image constructor not available"));
      return;
    }

    img.onload = () => {
      const ctx2 = canvas.getContext("2d");
      if (!ctx2) {
        reject(new Error("Canvas context not available"));
        return;
      }
      const dimensions = calculateOptimalDimensions(
        img.width,
        img.height,
        maxSize,
        maxSize
      );

      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      ctx2.drawImage(img, 0, 0, dimensions.width, dimensions.height);

      // Generate low-quality preview for fast loading
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      resolve(dataUrl);
    };

    img.onerror = () => {
      reject(new Error("Failed to generate image preview"));
    };

    img.src = URL.createObjectURL(file);
  });
};
