import React from 'react';
import { AlertTriangle, User, Phone, Calendar, FileText, Building, Clock } from 'lucide-react';
import { StandardDetailDialog, type StatusBadge } from './StandardDetailDialog';
import { TruncatedText } from './TruncatedText';
import {
    TYPOGRAPHY
} from './cardStyles';
import {
    getComplaintStatusColor,
    getComplaintStatusText,
    getUrgencyLevelColor,
    formatCardDate,
    getDisplayValue
} from './cardUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import type { ComplaintDetailWithRelations } from '../../../shared/types';
import { ConversationSection } from '../conversation/ConversationSection';

interface ComplaintDetailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    record: ComplaintDetailWithRelations | null;
    onEdit: (record: ComplaintDetailWithRelations) => void;
    onDelete: (id: string) => void;
}

export const ComplaintDetailDialog: React.FC<ComplaintDetailDialogProps> = ({
    isOpen,
    onClose,
    record,
    onEdit,
    onDelete
}) => {
    const { t } = useLanguage();

    const getStatusBadges = (record: ComplaintDetailWithRelations): StatusBadge[] => {
        const badges: StatusBadge[] = [
            {
                text: getComplaintStatusLabel(record.progressStatus),
                className: getComplaintStatusColor(record.progressStatus)
            }
        ];

        // Add urgency level badge
        if (record.urgencyLevel) {
            badges.push({
                text: getUrgencyLevelLabel(record.urgencyLevel),
                className: getUrgencyLevelColor(record.urgencyLevel)
            });
        }

        return badges;
    };

    const getComplaintStatusLabel = (status: ComplaintDetailWithRelations['progressStatus']): string => {
        switch (status) {
            case 'OPEN':
                return t('complaintDetails.statusOpen');
            case 'CLOSED':
                return t('complaintDetails.statusClosed');
            case 'ON_HOLD':
                return t('complaintDetails.statusOnHold');
            default:
                return status;
        }
    };

    const getUrgencyLevelLabel = (status: ComplaintDetailWithRelations['urgencyLevel']): string => {
        switch (status) {
            case 'High':
                return t('complaintDetails.urgencyLevel.High');
            case 'Medium':
                return t('complaintDetails.urgencyLevel.Medium');
            case 'Low':
                return t('complaintDetails.urgencyLevel.Low');
            default:
                return status;
        }
    };

    const renderHeader = (record: ComplaintDetailWithRelations) => (
        <>
            {/* Complainer name - prominently displayed */}
            <h3 className={TYPOGRAPHY.title}>
                {getDisplayValue(record.complainerName)}
            </h3>

            {/* Date of occurrence */}
            <p className={TYPOGRAPHY.subtitle}>
                {t('complaintDetails.columns.dateOfOccurrence')}: {formatCardDate(record.dateOfOccurrence)}
            </p>

            {/* Person involved - secondary heading */}
            <h4 className="text-sm font-medium text-secondary-700 mb-1 truncate">
                {t('complaintDetails.fields.personInvolved')}: {getDisplayValue(record.personInvolved)}
            </h4>
        </>
    );

    const renderContent = (record: ComplaintDetailWithRelations) => (
        <div className="space-y-4">
            {/* Complaint Content - Standardized container */}
            <div className="bg-secondary-50 p-4 rounded-lg">
                <h5 className="text-sm font-medium text-secondary-700 mb-2 flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>{t('complaintDetails.columns.complaintContent')}</span>
                </h5>
                <TruncatedText
                    text={record.complaintContent || ''}
                    maxLength={200}
                    className="text-secondary-600 leading-relaxed"
                />
            </div>

            {/* Contact Information - Standardized container */}
            <div className="bg-secondary-50 p-4 rounded-lg">
                <h5 className="text-sm font-medium text-secondary-700 mb-2 flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{t('complaintDetails.columns.contactInfo')}</span>
                </h5>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                        <span className="font-medium">{getDisplayValue(record.complainerName)}</span>
                    </div>
                    {record.complainerContact && (
                        <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                            <a
                                href={`tel:${record.complainerContact}`}
                                className="text-primary-600 hover:text-primary-700 underline"
                            >
                                {record.complainerContact}
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Information - Standardized container */}
            <div className="bg-secondary-50 p-4 rounded-lg">
                <h5 className="text-sm font-medium text-secondary-700 mb-2 flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{t('complaintDetails.fields.statusInformation')}</span>
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                        <span className={TYPOGRAPHY.label}>{t('complaintDetails.fields.status')}:</span>
                        <span className="ml-1">{getComplaintStatusText(record.progressStatus)}</span>
                    </div>
                    <div>
                        <span className={TYPOGRAPHY.label}>{t('complaintDetails.fields.urgency')}:</span>
                        <span className="ml-1">{getDisplayValue(record.urgencyLevel)}</span>
                    </div>
                    {record.daysPassed !== undefined && (
                        <div>
                            <span className={TYPOGRAPHY.label}>{t('complaintDetails.columns.daysPassed')}:</span>
                            <span className="ml-1">{record.daysPassed} {t('common.labels.days')}</span>
                        </div>
                    )}
                    {record.resolutionDate && (
                        <div>
                            <span className={TYPOGRAPHY.label}>{t('complaintDetails.fields.resolutionDate')}:</span>
                            <span className="ml-1">{formatCardDate(record.resolutionDate)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderDetails = (record: ComplaintDetailWithRelations) => (
        <>
            <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                <div>
                    <span className={TYPOGRAPHY.label}>{t('complaintDetails.fields.created')}:</span>
                    <span className="ml-1">{formatCardDate(record.createdAt)}</span>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                <div>
                    <span className={TYPOGRAPHY.label}>{t('complaintDetails.fields.lastUpdated')}:</span>
                    <span className="ml-1">{formatCardDate(record.updatedAt)}</span>
                </div>
            </div>

            {(record.responder || record.responderName) && (
                <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                    <div>
                        <span className={TYPOGRAPHY.label}>{t('complaintDetails.fields.responder')}:</span>
                        <span className="ml-1">{record.responderName || record.responder?.name || 'N/A'}</span>
                    </div>
                </div>
            )}

            {(record.company || record.companyName) && (
                <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                    <div>
                        <span className={TYPOGRAPHY.label}>{t('complaintDetails.fields.company')}:</span>
                        <span className="ml-1">{record.companyName || record.company?.name || 'N/A'}</span>
                    </div>
                </div>
            )}

            <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                <div>
                    <span className={TYPOGRAPHY.label}>{t('complaintDetails.fields.recordedBy')}:</span>
                    <span className="ml-1">{record.recorderName || record.recorder?.name || 'N/A'}</span>
                </div>
            </div>

        </>
    );

    const renderConversation = (record: ComplaintDetailWithRelations) => (
        <ConversationSection
            key={`complaint-conversation-${record.id}-${isOpen ? 'open' : 'closed'}`}
            parentType="complaint"
            parentId={record.id}
            onRepliesUpdate={(replies) => {
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
            title={t('complaintDetails.title')}
            icon={AlertTriangle}
            renderHeader={renderHeader}
            renderContent={renderContent}
            renderDetails={renderDetails}
            renderConversation={renderConversation}
            getStatusBadges={getStatusBadges}
            getRecordId={(record) => record.id.toString()}
        />
    );
};
