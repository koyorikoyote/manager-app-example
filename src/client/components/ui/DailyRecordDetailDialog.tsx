import React from 'react';
import { Calendar, User, Phone, FileText, CheckCircle, XCircle, AlertCircle, Camera } from 'lucide-react';
import { StandardDetailDialog, type StatusBadge } from './StandardDetailDialog';
import { TruncatedText } from './TruncatedText';
import { PhotoUpload } from './PhotoUpload';
import {
    TYPOGRAPHY
} from './cardStyles';
import {
    getDisplayValue
} from './cardUtils';
import { formatDateForInput } from '../../utils/dateUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import type { DailyRecordWithRelations } from '../../../shared/types';
import { ConversationSection } from '../conversation/ConversationSection';

interface DailyRecordDetailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    record: DailyRecordWithRelations | null;
    onEdit: (record: DailyRecordWithRelations) => void;
    onDelete: (id: string) => void;
}

const statusIcons = {
    'Excellent': <CheckCircle className="h-4 w-4 text-green-600" />,
    'Good': <CheckCircle className="h-4 w-4 text-blue-600" />,
    'Fair': <AlertCircle className="h-4 w-4 text-yellow-600" />,
    'Poor': <XCircle className="h-4 w-4 text-red-600" />,
};

const getConditionStatusColor = (status: string): string => {
    switch (status) {
        case 'Excellent':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'Good':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Fair':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Poor':
            return 'bg-red-100 text-red-800 border-red-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

export const DailyRecordDetailDialog: React.FC<DailyRecordDetailDialogProps> = ({
    isOpen,
    onClose,
    record,
    onEdit,
    onDelete
}) => {
    const { t } = useLanguage();

    const getStatusBadges = (record: DailyRecordWithRelations): StatusBadge[] => {
        const badges: StatusBadge[] = [
            {
                text: getConditionStatusLabel(record.conditionStatus),
                className: getConditionStatusColor(record.conditionStatus)
            }
        ];

        return badges;
    };

    const getConditionStatusLabel = (status: DailyRecordWithRelations['conditionStatus']): string => {
        switch (status) {
            case 'Excellent':
                return t('dailyRecord.conditionStatus.Excellent');
            case 'Good':
                return t('dailyRecord.conditionStatus.Good');
            case 'Fair':
                return t('dailyRecord.conditionStatus.Fair');
            case 'Poor':
                return t('dailyRecord.conditionStatus.Poor');
            default:
                return status;
        }
    };

    const renderHeader = (record: DailyRecordWithRelations) => (
        <>
            {/* Date of Record - prominently displayed */}
            <h3 className={TYPOGRAPHY.title}>
                {formatDateForInput(record.dateOfRecord as Date | string | null | undefined).replace(/-/g, '/')}
            </h3>

            {/* Staff Name - secondary heading */}
            <h4 className="text-sm font-medium text-secondary-700 mb-1 truncate">
                {t('dailyRecord.columns.staffName')}: {getDisplayValue(record.staff?.name)}
            </h4>

            {/* Staff Employee ID */}
            <p className={TYPOGRAPHY.subtitle}>
                {t('staff.employeeId')}: {getDisplayValue(record.staff?.employeeId)}
            </p>
        </>
    );

    const renderContent = (record: DailyRecordWithRelations) => (
        <div className="space-y-4">
            {/* Feedback Content - Standardized container */}
            <div className="bg-secondary-50 p-4 rounded-lg">
                <h5 className="text-sm font-medium text-secondary-700 mb-2 flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>{t('dailyRecord.columns.feedbackContent')}</span>
                </h5>
                <TruncatedText
                    text={record.feedbackContent}
                    maxLength={200}
                    className="text-secondary-600 leading-relaxed"
                />
            </div>

            {/* Staff Information - Standardized container */}
            <div className="bg-secondary-50 p-4 rounded-lg">
                <h5 className="text-sm font-medium text-secondary-700 mb-2 flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{t('detailPages.staff.sections.personalInformation')}</span>
                </h5>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                        <div>
                            <span className={TYPOGRAPHY.label}>{t('dailyRecord.columns.staffName')}:</span>
                            <span className="ml-1 font-medium">{getDisplayValue(record.staff?.name)}</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <span className="h-4 w-4 text-secondary-400 flex-shrink-0 text-xs">#</span>
                        <div>
                            <span className={TYPOGRAPHY.label}>{t('staff.employeeId')}:</span>
                            <span className="ml-1">{getDisplayValue(record.staff?.employeeId)}</span>
                        </div>
                    </div>

                    {record.staff?.phone && (
                        <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                            <div>
                                <span className={TYPOGRAPHY.label}>{t('staff.phone')}:</span>
                                <a
                                    href={`tel:${record.staff.phone}`}
                                    className="ml-1 text-primary-600 hover:text-primary-700 underline"
                                >
                                    {record.staff.phone}
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Personal Contact Information - Standardized container */}
            {record.contactNumber && (
                <div className="bg-secondary-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-secondary-700 mb-2 flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>{t('dailyRecord.columns.contactNumber')}</span>
                    </h5>
                    <div className="text-sm">
                        <a
                            href={`tel:${record.contactNumber}`}
                            className="text-primary-600 hover:text-primary-700 underline"
                        >
                            {record.contactNumber}
                        </a>
                    </div>
                </div>
            )}

            {/* Incident Photo - Standardized container */}
            <div className="bg-secondary-50 p-4 rounded-lg">
                <h5 className="text-sm font-medium text-secondary-700 mb-2 flex items-center space-x-2">
                    <Camera className="h-4 w-4" />
                    <span>{t('photoUpload.labels.photo')}</span>
                </h5>
                {record.photo ? (
                    <PhotoUpload
                        currentPhoto={record.photo}
                        onPhotoUpload={async () => { }} // Not used in view mode
                        isEditMode={false}
                        compact={true}
                    />
                ) : (
                    <div className="text-sm text-secondary-500 italic">
                        {t('common.emptyStates.noData')}
                    </div>
                )}
            </div>
        </div>
    );

    const renderDetails = (record: DailyRecordWithRelations) => (
        <>
            <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                <div>
                    <span className={TYPOGRAPHY.label}>{t('dailyRecord.columns.dateOfRecord')}:</span>
                    <span className="ml-1">{formatDateForInput(record.dateOfRecord as Date | string | null | undefined).replace(/-/g, '/')}</span>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <div className="h-4 w-4 flex-shrink-0 flex items-center justify-center">
                    {statusIcons[record.conditionStatus as keyof typeof statusIcons]}
                </div>
                <div>
                    <span className={TYPOGRAPHY.label}>{t('dailyRecord.columns.conditionStatus')}:</span>
                    <span className="ml-1">{getConditionStatusLabel(record.conditionStatus)}</span>
                </div>
            </div>
        </>
    );

    const renderConversation = (record: DailyRecordWithRelations) => (
        <ConversationSection
            key={`daily-record-conversation-${record.id}-${isOpen ? 'open' : 'closed'}`}
            parentType="dailyRecord"
            parentId={record.id}
            onRepliesUpdate={(replies) => {
                // Optional: Handle conversation updates if needed
                console.log('Conversation updated:', replies.length, 'messages');
            }}
        />
    );

    return (
        <StandardDetailDialog
            isOpen={isOpen}
            onClose={onClose}
            record={record}
            onEdit={onEdit}
            onDelete={onDelete}
            title={t('dailyRecord.title')}
            icon={Calendar}
            renderHeader={renderHeader}
            renderContent={renderContent}
            renderDetails={renderDetails}
            renderConversation={renderConversation}
            getStatusBadges={getStatusBadges}
            getRecordId={(record) => record.id.toString()}
        />
    );
};
