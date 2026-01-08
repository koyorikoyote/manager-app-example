import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import {
    LAYOUT,
    BADGE_STYLES,
    DIALOG_STYLES
} from './cardStyles';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../contexts/LanguageContext';

export interface StatusBadge {
    text: string;
    className: string;
}

export interface StandardDetailDialogProps<T> {
    isOpen: boolean;
    onClose: () => void;
    record: T | null;
    onEdit: (record: T) => void;
    onDelete: (id: string) => void;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    renderHeader: (record: T) => React.ReactNode;
    renderContent: (record: T) => React.ReactNode;
    renderDetails?: (record: T) => React.ReactNode;
    renderConversation?: (record: T) => React.ReactNode;
    getStatusBadges?: (record: T) => StatusBadge[];
    getRecordId: (record: T) => string;
}

export const StandardDetailDialog = <T,>({
    isOpen,
    onClose,
    record,
    onEdit,
    onDelete,
    title,
    icon: Icon,
    renderHeader,
    renderContent,
    renderDetails,
    renderConversation,
    getStatusBadges,
    getRecordId
}: StandardDetailDialogProps<T>) => {
    const { t } = useLanguage();

    if (!record) return null;

    const handleEdit = () => {
        onEdit(record);
        onClose();
    };

    const handleDelete = () => {
        onDelete(getRecordId(record));
        onClose();
    };

    const statusBadges = getStatusBadges?.(record) || [];

    const footer = (
        <div className="flex items-center justify-end space-x-2">
            <Button
                variant="outline"
                onClick={onClose}
            >
                {t('common.actions.close')}
            </Button>
        </div>
    );

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={footer}
            size="lg"
        >
            <div className="space-y-6">
                {/* Header Section with Action Buttons - Standardized Layout */}
                <div className={DIALOG_STYLES.layout.headerWithActions}>
                    <div className={DIALOG_STYLES.layout.iconTitleContainer}>
                        <div className="flex-shrink-0 mt-1">
                            <Icon className="h-5 w-5 text-primary-600" />
                        </div>

                        <div className={LAYOUT.titleContainer}>
                            {/* Status Badges with standardized styling */}
                            {statusBadges.length > 0 && (
                                <div className={DIALOG_STYLES.statusBadges.container}>
                                    {statusBadges.map((badge, index) => (
                                        <span
                                            key={index}
                                            className={cn(
                                                BADGE_STYLES.base,
                                                BADGE_STYLES.interactive,
                                                DIALOG_STYLES.statusBadges.enhanced,
                                                badge.className
                                            )}
                                        >
                                            {badge.text}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Header Content */}
                            {renderHeader(record)}
                        </div>
                    </div>

                    {/* Action Buttons - Standardized positioning and styling */}
                    <div className={DIALOG_STYLES.layout.actionButtons}>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEdit}
                            className={cn(
                                DIALOG_STYLES.actionButtons.edit,
                                DIALOG_STYLES.navigation.editButton
                            )}
                        >
                            <Edit className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span className="truncate">{t('common.actions.edit')}</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDelete}
                            className={cn(
                                DIALOG_STYLES.actionButtons.delete
                            )}
                        >
                            <Trash2 className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span className="truncate">{t('common.actions.delete')}</span>
                        </Button>
                    </div>
                </div>

                {/* Content Section - Standardized spacing */}
                <div className={DIALOG_STYLES.layout.contentSections}>
                    {renderContent(record)}
                </div>

                {/* Details Section - Standardized header and layout */}
                {renderDetails && (
                    <div className={DIALOG_STYLES.layout.contentSections}>
                        <h4 className={DIALOG_STYLES.sectionHeaders.detail}>
                            {t('common.labels.additionalDetails')}
                        </h4>
                        <div className={DIALOG_STYLES.layout.detailsGrid}>
                            {renderDetails(record)}
                        </div>
                    </div>
                )}

                {/* Conversation Section - Rendered after details */}
                {renderConversation && (
                    <div className={DIALOG_STYLES.layout.contentSections}>
                        {renderConversation(record)}
                    </div>
                )}
            </div>
        </Dialog>
    );
};

// Reusable FormDateInput component (matches behavior in StandardFormDialog).
// Keeps input[type="date"] for native picker while overlaying a formatted visual (YYYY/MM/DD).
export interface FormDateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
    displayValue?: string;
}

export const FormDateInput: React.FC<FormDateInputProps> = ({
    error = false,
    className,
    displayValue,
    value,
    placeholder = 'YYYY/MM/DD',
    ...props
}) => {
    // Prefer explicit displayValue, otherwise use the raw input value (expected YYYY-MM-DD).
    const raw = (typeof displayValue === 'string' && displayValue) || (typeof value === 'string' ? value : '');
    const display = raw ? raw.replace(/-/g, '/') : '';
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const openPicker = () => {
        const el = inputRef.current;
        if (!el) return;
        const anyEl = el as any;
        if (typeof anyEl.showPicker === 'function') {
            try { anyEl.showPicker(); return; } catch { /* fallthrough */ }
        }
        el.focus();
        el.click();
    };

    return (
        <div className="relative">
            <input
                ref={inputRef}
                type="date"
                value={typeof value === 'string' ? value : ''}
                className={cn(
                    DIALOG_STYLES.form.input,
                    error && "border-red-300 focus:border-red-500 focus:ring-red-500",
                    className
                )}
                // Make native text transparent so overlay shows the formatted value
                style={{
                    color: 'transparent',
                    WebkitTextFillColor: 'transparent',
                    paddingRight: '2.5rem',
                    caretColor: 'transparent',
                    touchAction: 'manipulation',
                }}
                {...props}
            />
            <span
                className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-black truncate"
                style={{ right: '2.5rem' }}
            >
                {display || placeholder}
            </span>

            {/* Transparent clickable icon to open native picker (preserve native look) */}
            <button
                type="button"
                onClick={openPicker}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center"
                aria-hidden="true"
                tabIndex={-1}
                style={{ width: 28, height: 28, background: 'transparent', border: 'none', padding: 0 }}
            >
                <svg className="h-5 w-5 text-gray-700" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M16 3V7M8 3V7M3 11H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </button>
        </div>
    );
};
