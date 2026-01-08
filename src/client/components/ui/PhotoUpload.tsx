import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Camera, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';
import { useResponsive } from '../../hooks/useResponsive';
import { useLocalization } from '../../hooks/useLocalization';
import { compressImage, validateImage, generateImagePreview, supportsWebP } from '../../utils/imageOptimization';
import type { PhotoUploadProps } from '../../../shared/types';

const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp';

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
    currentPhoto,
    onPhotoUpload,
    onPhotoRemove,
    isEditMode,
    loading = false,
    error = null,
    compact = false,
}) => {
    const { isMobile, isTablet } = useResponsive();
    const { t } = useLocalization();
    const [isDragOver, setIsDragOver] = useState(false);
    // Resolve server-provided photo paths to a URL usable by the client dev/prod environments.
    // Handles:
    //  - Absolute URLs (http(s):// or protocol-relative //) and data URIs (returned as-is)
    //  - Server-returned relative paths like "/uploads/..." (production served from same origin)
    //  - In development, construct a backend-origin URL (port 3001) so the frontend dev server
    //    doesn't need special proxy rewriting for static uploads.
    const resolveServerPhotoUrl = (photo: string | null | undefined): string | null => {
        if (!photo) return null;

        try {
            // Return full URLs and data URIs unchanged
            if (/^(https?:)?\/\//.test(photo) || photo.startsWith('data:')) {
                return photo;
            }

            // Ensure we have a leading slash for path handling
            const normalized = photo.startsWith('/') ? photo : `/${photo}`;

            // If it's an uploads path and we're in development, point directly at the backend dev server
            if (normalized.startsWith('/uploads') && process.env.NODE_ENV === 'development') {
                const host = window.location.hostname || '127.0.0.1';
                const backendPort = 3001; // matches webpack.dev.js proxy target
                return `${window.location.protocol}//${host}:${backendPort}${normalized}`;
            }

            // Otherwise return the normalized path (works for production SSR or when served from same origin)
            return normalized;
        } catch {
            // On any error, return the original value (best-effort)
            return photo;
        }
    };

    const [preview, setPreview] = useState<string | null>(resolveServerPhotoUrl(currentPhoto) || null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset preview to currentPhoto when exiting edit mode without saving
    useEffect(() => {
        if (!isEditMode) {
            setPreview(resolveServerPhotoUrl(currentPhoto) || null);
            setValidationError(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [isEditMode, currentPhoto]);

    // Compute loading state early for use in callbacks
    const displayError = error || validationError;
    const isLoading = loading || isProcessing;

    // Optimized file validation using the new utility
    const validateFile = useCallback(async (file: File): Promise<string | null> => {
        // Check file type
        if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
            return t('photoUpload.errors.invalidFormat');
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            return t('photoUpload.errors.fileTooLarge');
        }

        // Use optimized validation
        const validationResult = await validateImage(file);
        if (!validationResult.isValid) {
            return validationResult.error || t('photoUpload.errors.corruptedFile');
        }

        return null;
    }, [t]);

    const handleFileSelect = useCallback(async (file: File) => {
        setValidationError(null);
        setIsProcessing(true);

        try {
            // Validate file first
            const validationResult = await validateFile(file);
            if (validationResult) {
                setValidationError(validationResult);
                return;
            }

            // Generate optimized preview immediately for better UX
            const previewUrl = await generateImagePreview(file, 200);
            setPreview(previewUrl);

            // Determine optimal format based on browser support
            const webpSupported = await supportsWebP();
            const compressionOptions = {
                maxWidth: 800,
                maxHeight: 800,
                quality: 0.85,
                format: webpSupported ? 'webp' as const : 'jpeg' as const,
                maxSizeKB: 500
            };

            // Compress image with optimized settings
            const processedFile = await compressImage(file, compressionOptions);

            // Upload the processed file
            await onPhotoUpload(processedFile);

        } catch (uploadError: unknown) {
            // Handle different types of upload errors
            const errorMessage = uploadError instanceof Error ? uploadError.message : '';
            if (errorMessage.includes('network') || errorMessage.includes('Network')) {
                setValidationError(t('photoUpload.errors.networkError'));
            } else if (errorMessage.includes('compress') || errorMessage.includes('process')) {
                setValidationError(t('photoUpload.errors.processingFailed'));
            } else {
                setValidationError(t('photoUpload.errors.uploadFailed'));
            }
            setPreview(currentPhoto || null);
        } finally {
            setIsProcessing(false);
        }
    }, [validateFile, onPhotoUpload, currentPhoto, t]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isEditMode && !isLoading) {
            setIsDragOver(true);
        }
    }, [isEditMode, isLoading]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        if (!isEditMode || isLoading) return;

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, [isEditMode, isLoading, handleFileSelect]);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, [handleFileSelect]);

    const handleBrowseClick = useCallback(() => {
        if (fileInputRef.current && isEditMode && !isLoading) {
            fileInputRef.current.click();
        }
    }, [isEditMode, isLoading]);

    const handleRemovePhoto = useCallback(async () => {
        // Optimistic UI: clear preview immediately
        setPreview(null);
        setValidationError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        if (typeof onPhotoRemove === 'function') {
            try {
                setIsProcessing(true);
                await onPhotoRemove();
            } catch (err) {
                // If removal failed, restore preview from currentPhoto (best-effort)
                setPreview(resolveServerPhotoUrl(currentPhoto) || null);
                const errMsg = err instanceof Error ? err.message : String(err);
                setValidationError(errMsg || null);
            } finally {
                setIsProcessing(false);
            }
        }
    }, [onPhotoRemove, currentPhoto]);

    // Responsive dimensions
    const photoSize = isMobile || isTablet ? 'w-20 h-20' : 'w-32 h-32';
    const iconSize = isMobile || isTablet ? 'h-6 w-6' : 'h-8 w-8';

    // Compact mode for header sections
    if (compact) {
        // Show Camera placeholder when no photo exists (same as DestinationDetailPage)
        if (!isEditMode && !preview) {
            return (
                <div className={cn(
                    'flex items-center justify-center bg-neutral-100 rounded-lg',
                    photoSize
                )} data-testid="camera-placeholder">
                    <Camera className={cn(iconSize, 'text-neutral-400')} />
                </div>
            );
        }

        // Show photo when it exists (with fixed CSS to prevent artifacts like DestinationDetailPage)
        if (!isEditMode && preview) {
            return (
                <div className={cn(
                    'relative bg-neutral-100 rounded-lg overflow-hidden',
                    photoSize
                )}>
                    <img
                        src={preview}
                        alt={t('photoUpload.labels.photo')}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                            display: 'block',
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            border: 'none',
                            outline: 'none',
                            margin: 0,
                            padding: 0
                        }}
                    />
                </div>
            );
        }

        // Compact edit mode - show full image preview when uploaded
        return (
            <div className="flex flex-col items-center space-y-2">
                <div
                    className={cn(
                        'relative rounded-lg transition-all duration-200 cursor-pointer overflow-hidden',
                        preview
                            ? 'bg-neutral-100'
                            : cn(
                                'border-2 border-dashed',
                                isDragOver && !isLoading
                                    ? 'border-primary-500 bg-primary-50'
                                    : displayError
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-neutral-300 bg-neutral-50 hover:border-neutral-400'
                            ),
                        isLoading && 'opacity-50 cursor-not-allowed',
                        photoSize
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleBrowseClick}
                >
                    {preview ? (
                        <>
                            {/* Full image preview filling the entire component */}
                            <img
                                src={preview}
                                alt={t('photoUpload.labels.photoPreview')}
                                className="absolute inset-0 w-full h-full object-cover"
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    border: 'none',
                                    outline: 'none',
                                    margin: 0,
                                    padding: 0
                                }}
                            />
                            {/* Clear button overlay - enhanced visual feedback */}
                            {!isLoading && (
                                <button
                                    type="button"
                                    className={cn(
                                        'absolute top-1 right-1 p-0.5 rounded-full',
                                        'text-red-500 hover:text-white',
                                        'bg-white/80 hover:bg-red-500',
                                        'border border-red-200 hover:border-red-500',
                                        'cursor-pointer transition-all duration-200',
                                        'shadow-sm hover:shadow-md',
                                        'focus:outline-none focus:ring-2 focus:ring-red-500/20',
                                        'touch:active:scale-90',
                                        isMobile ? 'h-6 w-6' : 'h-7 w-7'
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemovePhoto();
                                    }}
                                    title="Remove photo"
                                >
                                    <X className={cn(isMobile ? 'h-3 w-3' : 'h-4 w-4')} />
                                </button>
                            )}
                        </>
                    ) : (
                        /* Upload icon display when no photo */
                        <div className="flex flex-col items-center justify-center h-full">
                            <Upload className={cn(
                                'text-neutral-400 mb-1',
                                isMobile ? 'h-4 w-4' : 'h-6 w-6'
                            )} />
                        </div>
                    )}

                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                            <div className={cn(
                                'animate-spin rounded-full border-b-2 border-primary-600',
                                'h-4 w-4'
                            )}></div>
                        </div>
                    )}
                </div>

                {/* Standardized text label below */}
                <div className="text-center">
                    <p className={cn(
                        'text-neutral-600 font-medium',
                        isMobile ? 'text-xs' : 'text-sm'
                    )}>
                        {preview ? t('photoUpload.labels.changePhoto') : t('photoUpload.labels.uploadPhoto')}
                    </p>
                </div>

                {/* Error display for compact mode */}
                {displayError && (
                    <div className="flex items-center space-x-1 text-red-600">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span className="text-xs">{displayError}</span>
                    </div>
                )}

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS}
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={isLoading}
                />
            </div>
        );
    }

    // Show Camera placeholder when no photo exists (same as DestinationDetailPage)
    if (!isEditMode && !preview) {
        return (
            <div className={cn(
                'flex items-center justify-center bg-neutral-100 rounded-lg',
                photoSize
            )} data-testid="camera-placeholder">
                <Camera className={cn(iconSize, 'text-neutral-400')} />
            </div>
        );
    }

    // Show photo when it exists (with fixed CSS to prevent artifacts like DestinationDetailPage)
    if (!isEditMode && preview) {
        return (
            <div className={cn(
                'relative bg-neutral-100 rounded-lg overflow-hidden',
                photoSize
            )}>
                <img
                    src={preview}
                    alt="Photo"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        border: 'none',
                        outline: 'none',
                        margin: 0,
                        padding: 0
                    }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Photo Display/Upload Area */}
            <div
                className={cn(
                    'relative border-2 border-dashed rounded-lg transition-all duration-200',
                    isDragOver && !isLoading
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : displayError
                            ? 'border-red-300 bg-red-50'
                            : 'border-neutral-300 bg-neutral-50 hover:border-primary-300 hover:bg-primary-25',
                    isLoading && 'opacity-50 cursor-not-allowed',
                    !isLoading && isEditMode && 'cursor-pointer hover:shadow-sm',
                    'touch:active:scale-95'
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={!preview ? handleBrowseClick : undefined}
            >
                {preview ? (
                    <div className={cn(
                        'relative w-full',
                        isMobile ? 'h-32' : isTablet ? 'h-40' : 'h-48'
                    )}>
                        <img
                            src={preview}
                            alt={t('photoUpload.labels.photoPreview')}
                            className="w-full h-full object-cover rounded-lg"
                            style={{
                                display: 'block',
                                maxWidth: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                        {isEditMode && !isLoading && (
                            <button
                                type="button"
                                className={cn(
                                    'absolute top-2 right-2 p-1 rounded-full',
                                    'text-red-500 hover:text-white',
                                    'bg-white/80 hover:bg-red-500',
                                    'border border-red-200 hover:border-red-500',
                                    'cursor-pointer transition-all duration-200',
                                    'shadow-sm hover:shadow-md',
                                    'focus:outline-none focus:ring-2 focus:ring-red-500/20',
                                    'touch:active:scale-90',
                                    isMobile ? 'h-8 w-8' : 'h-9 w-9'
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemovePhoto();
                                }}
                                title="Remove photo"
                            >
                                <X className={cn(isMobile ? 'h-4 w-4' : 'h-5 w-5')} />
                            </button>
                        )}
                        {/* Photo upload area - accepts any dimensions */}
                    </div>
                ) : (
                    <div className={cn(
                        'flex flex-col items-center justify-center text-center',
                        isMobile ? 'p-4' : isTablet ? 'p-6' : 'p-8'
                    )}>
                        <div className={cn(
                            'mb-4 p-3 rounded-full transition-all duration-200',
                            isDragOver ? 'bg-primary-100 shadow-sm' : 'bg-neutral-100',
                            isMobile && 'p-2 mb-3'
                        )}>
                            <Upload className={cn(
                                'transition-colors duration-200',
                                isDragOver ? 'text-primary-600' : 'text-neutral-500',
                                isMobile ? 'h-6 w-6' : 'h-8 w-8'
                            )} />
                        </div>
                        <div className="space-y-2">
                            <p className={cn(
                                'font-medium text-neutral-700',
                                isMobile ? 'text-xs' : 'text-sm'
                            )}>
                                {isDragOver ? t('photoUpload.labels.dropPhotoHere') : t('photoUpload.labels.uploadPhoto')}
                            </p>
                            {!isMobile && (
                                <p className="text-xs text-neutral-500">
                                    {t('photoUpload.labels.dragAndDrop')}
                                </p>
                            )}
                            <p className={cn(
                                'text-neutral-400',
                                isMobile ? 'text-xs' : 'text-xs'
                            )}>
                                {t('photoUpload.labels.supportedFormats')}
                            </p>
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <div className={cn(
                                'animate-spin rounded-full border-b-2 border-primary-600',
                                isMobile ? 'h-5 w-5' : 'h-6 w-6'
                            )}></div>
                            <span className={cn(
                                'text-neutral-600',
                                isMobile ? 'text-xs' : 'text-sm'
                            )}>{isProcessing ? t('photoUpload.status.processing') : t('photoUpload.status.uploading')}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Browse Button */}
            {!preview && isEditMode && (
                <div className="flex justify-center">
                    <Button
                        variant="outline"
                        onClick={handleBrowseClick}
                        disabled={isLoading}
                        className={cn(
                            'w-full sm:w-auto',
                            'touch:min-h-[48px] touch:min-w-[48px]',
                            'hover:bg-primary-50 hover:border-primary-300',
                            'focus:ring-2 focus:ring-primary-500/20',
                            isMobile && 'text-sm py-3'
                        )}
                    >
                        <Camera className={cn(
                            'mr-2 transition-colors duration-200',
                            isMobile ? 'h-4 w-4' : 'h-4 w-4'
                        )} />
                        {t('photoUpload.labels.browseFiles')}
                    </Button>
                </div>
            )}

            {/* Error Display */}
            {displayError && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <span className="text-sm text-red-700">{displayError}</span>
                </div>
            )}

            {/* Success Message */}
            {!displayError && !isLoading && preview && currentPhoto !== preview && (
                <div className="flex items-center space-x-2 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-primary-600 flex-shrink-0" />
                    <span className="text-sm text-primary-700">{t('photoUpload.status.uploadSuccessful')}</span>
                </div>
            )}

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isLoading}
            />
        </div>
    );
};
