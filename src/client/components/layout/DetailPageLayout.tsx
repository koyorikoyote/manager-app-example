import React from 'react';
import { ArrowLeft, Edit, Trash2, Save, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGlassBlue } from '../../hooks/useGlassBlue';
import { useResponsiveNavigation } from '../../hooks/useResponsiveNavigation';
import { cn } from '../../utils/cn';

export interface DetailPageLayoutProps {
    title: string;
    isEditMode?: boolean;
    isLoading?: boolean;
    error?: string | null;
    onEdit?: () => void;
    onDelete?: () => void;
    onSave?: () => void;
    onCancel?: () => void;
    onClose?: () => void;
    children: React.ReactNode;
    className?: string;
    showEditButton?: boolean;
    showDeleteButton?: boolean;
    isSaving?: boolean;
}

/**
 * Shared page layout component for detail and edit pages
 * Provides consistent header, content, and action button structure
 */
export const DetailPageLayout: React.FC<DetailPageLayoutProps> = ({
    title,
    isEditMode = false,
    isLoading = false,
    error = null,
    onEdit,
    onDelete,
    onSave,
    onCancel,
    onClose,
    children,
    className,
    showEditButton = true,
    showDeleteButton = true,
    isSaving = false,
}) => {
    const { t } = useLanguage();
    const { handleClose } = useResponsiveNavigation();
    const isGlassBlue = useGlassBlue();

    const handleCloseClick = () => {
        if (onClose) {
            onClose();
        } else {
            handleClose();
        }
    };

    const handleEditClick = () => {
        if (onEdit) {
            onEdit();
        }
    };

    const handleDeleteClick = () => {
        if (onDelete) {
            onDelete();
        }
    };

    const handleSaveClick = () => {
        if (onSave) {
            onSave();
        }
    };

    const handleCancelClick = () => {
        if (onCancel) {
            onCancel();
        }
    };

    return (
        <div className={cn(
            "min-h-screen",
            isGlassBlue ? "bg-[radial-gradient(ellipse_at_center,_#eff6ff_0%,_#e0f2fe_100%)]" : "bg-neutral-50",
            className
        )}>
            {/* Header */}
            <div className={cn(
                "shadow-sm border-b",
                isGlassBlue 
                    ? "glass-blue-nav border-blue-100/50" 
                    : "bg-white border-neutral-200"
            )}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Left side - Back button and title */}
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCloseClick}
                                className="flex items-center space-x-2 text-neutral-600 hover:text-neutral-900"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">{t('common.actions.back')}</span>
                            </Button>

                            <div className="border-l border-neutral-300 h-6"></div>

                            <h1 className="text-lg font-semibold text-secondary-900 truncate">
                                {title}
                            </h1>

                            {isEditMode && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {t('detailPages.newPages.staff.editingLabel')}
                                </span>
                            )}
                        </div>

                        {/* Right side - Action buttons */}
                        <div className="flex items-center space-x-2">
                            {isEditMode ? (
                                // Edit mode buttons
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancelClick}
                                        disabled={isLoading || isSaving}
                                        className="flex items-center space-x-1"
                                    >
                                        <X className="h-4 w-4" />
                                        <span className="hidden sm:inline">{t('common.actions.cancel')}</span>
                                    </Button>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={handleSaveClick}
                                        disabled={isLoading || isSaving}
                                        loading={isSaving}
                                        className="flex items-center space-x-1"
                                    >
                                        <Save className="h-4 w-4" />
                                        <span className="hidden sm:inline">{t('common.actions.save')}</span>
                                    </Button>
                                </>
                            ) : (
                                // View mode buttons
                                <>
                                    {showEditButton && onEdit && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleEditClick}
                                            disabled={isLoading}
                                            className="flex items-center space-x-1"
                                        >
                                            <Edit className="h-4 w-4" />
                                            <span className="hidden sm:inline">{t('common.actions.edit')}</span>
                                        </Button>
                                    )}
                                    {showDeleteButton && onDelete && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleDeleteClick}
                                            disabled={isLoading}
                                            className="flex items-center space-x-1 text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="hidden sm:inline">{t('common.actions.delete')}</span>
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    {t('detailPages.newPages.common.errorLoadingData')}
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{error}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                {!isLoading && !error && (
                    <div>
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
};