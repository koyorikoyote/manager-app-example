import React from 'react';
import { MessageSquare, User, Phone, Calendar, FileText, Building, Clock } from 'lucide-react';
import { StandardDetailDialog, type StatusBadge } from './StandardDetailDialog';
import { TruncatedText } from './TruncatedText';
import {
    TYPOGRAPHY
} from './cardStyles';
import {
    formatCardDate,
    getDisplayValue
} from './cardUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import type { InquiryWithRelations } from '../../../shared/types';
import { ConversationSection } from '../conversation/ConversationSection';

interface InquiryDetailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    record: InquiryWithRelations | null;
    onEdit: (record: InquiryWithRelations) => void;
    onDelete: (id: string) => void;
}

export const InquiryDetailDialog: React.FC<InquiryDetailDialogProps> = ({
    isOpen,
    onClose,
    record,
    onEdit,
    onDelete
}) => {
    const { t } = useLanguage();

    const getStatusBadges = (record: InquiryWithRelations): StatusBadge[] => {
        const badges: StatusBadge[] = [
            {
                text: getStatusLabel(record.progressStatus),
                className: getInquiryStatusColor(record.progressStatus)
            }
        ];

        // Add inquiry type badge
        if (record.typeOfInquiry) {
            badges.push({
                text: getInquiryTypeLabel(record.typeOfInquiry),
                className: getInquiryTypeColor(record.typeOfInquiry)
            });
        }

        return badges;
    };

    const getStatusLabel = (status: InquiryWithRelations['progressStatus']): string => {
        switch (status) {
            case 'OPEN':
                return t('inquiriesNotifications.progressStatus.OPEN');
            case 'CLOSED':
                return t('inquiriesNotifications.progressStatus.CLOSED');
            case 'ON_HOLD':
                return t('inquiriesNotifications.progressStatus.ON_HOLD');
            default:
                return status;
        }
    };

    const getInquiryStatusColor = (status: InquiryWithRelations['progressStatus']): string => {
        switch (status) {
            case 'OPEN':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'CLOSED':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'ON_HOLD':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getInquiryTypeColor = (type: string): string => {
        const typeColors: Record<string, string> = {
            'General': 'bg-blue-100 text-blue-800 border-blue-200',
            'Technical': 'bg-purple-100 text-purple-800 border-purple-200',
            'Billing': 'bg-orange-100 text-orange-800 border-orange-200',
            'Support': 'bg-green-100 text-green-800 border-green-200',
            'Complaint': 'bg-red-100 text-red-800 border-red-200',
        };
        return typeColors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getInquiryTypeLabel = (type: string | null | undefined): string => {
        switch (type) {
            case 'General':
                return t('inquiriesNotifications.types.General');
            case 'Technical':
                return t('inquiriesNotifications.types.Technical');
            case 'Billing':
                return t('inquiriesNotifications.types.Billing');
            case 'Support':
                return t('inquiriesNotifications.types.Support');
            case 'Complaint':
                return t('inquiriesNotifications.types.Complaint');
            default:
                return getDisplayValue(type || '');
        }
    };

    const renderHeader = (record: InquiryWithRelations) => (
        <>
            {/* Inquirer name - prominently displayed */}
            <h3 className={TYPOGRAPHY.title}>
                {getDisplayValue(record.inquirerName)}
            </h3>

            {/* Inquiry date */}
            <p className={TYPOGRAPHY.subtitle}>
                {t('inquiriesNotifications.columns.dateOfInquiry')}: {formatCardDate(record.dateOfInquiry)}
            </p>

            {/* Type of inquiry - secondary heading */}
            <h4 className="text-sm font-medium text-secondary-700 mb-1 truncate">
                {t('inquiriesNotifications.columns.typeOfInquiry')}: {getDisplayValue(record.typeOfInquiry)}
            </h4>
        </>
    );

    const renderContent = (record: InquiryWithRelations) => (
        <div className="space-y-4">
            {/* Inquiry Content - Standardized container */}
            <div className="bg-secondary-50 p-4 rounded-lg">
                <h5 className="text-sm font-medium text-secondary-700 mb-2 flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>{t('inquiriesNotifications.columns.inquiryContent')}</span>
                </h5>
                <TruncatedText
                    text={record.inquiryContent || ''}
                    maxLength={200}
                    className="text-secondary-600 leading-relaxed"
                />
            </div>

            {/* Contact Information - Standardized container */}
            <div className="bg-secondary-50 p-4 rounded-lg">
                <h5 className="text-sm font-medium text-secondary-700 mb-2 flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{t('company.contactInformation')}</span>
                </h5>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                        <span className="font-medium">{getDisplayValue(record.inquirerName)}</span>
                    </div>
                    {record.inquirerContact && (
                        <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                            <a
                                href={`tel:${record.inquirerContact}`}
                                className="text-primary-600 hover:text-primary-700 underline"
                            >
                                {record.inquirerContact}
                            </a>
                        </div>
                    )}
                    {record.company && (
                        <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                            <span className="text-secondary-600">
                                {record.company.name}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Status and Resolution Information - Standardized container */}
            <div className="bg-secondary-50 p-4 rounded-lg">
                <h5 className="text-sm font-medium text-secondary-700 mb-2 flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>{t('complaintDetails.fields.statusInformation')}</span>
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                        <span className={TYPOGRAPHY.label}>{t('inquiriesNotifications.columns.progressStatus')}:</span>
                        <span className="ml-1">{getStatusLabel(record.progressStatus)}</span>
                    </div>
                    <div>
                        <span className={TYPOGRAPHY.label}>{t('inquiriesNotifications.columns.resolutionDate')}:</span>
                        <span className="ml-1">
                            {record.resolutionDate ? formatCardDate(record.resolutionDate) : t('common.status.pending')}
                        </span>
                    </div>
                    {record.responder && (
                        <div>
                            <span className={TYPOGRAPHY.label}>{t('inquiriesNotifications.columns.responderName')}:</span>
                            <span className="ml-1">{record.responder.name}</span>
                        </div>
                    )}
                    <div>
                        <span className={TYPOGRAPHY.label}>{t('inquiriesNotifications.columns.recorderName')}:</span>
                        <span className="ml-1">{record.recorder?.name || t('detailPages.common.notSpecified')}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDetails = (record: InquiryWithRelations) => (
        <>
            <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                <div>
                    <span className={TYPOGRAPHY.label}>{t('inquiriesNotifications.columns.dateOfInquiry')}:</span>
                    <span className="ml-1">{formatCardDate(record.dateOfInquiry)}</span>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                <div>
                    <span className={TYPOGRAPHY.label}>{t('inquiriesNotifications.columns.typeOfInquiry')}:</span>
                    <span className="ml-1">{getInquiryTypeLabel(record.typeOfInquiry)}</span>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                <div>
                    <span className={TYPOGRAPHY.label}>{t('inquiriesNotifications.columns.inquirerName')}:</span>
                    <span className="ml-1">{getDisplayValue(record.inquirerName)}</span>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                <div>
                    <span className={TYPOGRAPHY.label}>{t('inquiriesNotifications.columns.contactInfo')}:</span>
                    <span className="ml-1">{getDisplayValue(record.inquirerContact)}</span>
                </div>
            </div>

            {record.company && (
                <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                    <div>
                        <span className={TYPOGRAPHY.label}>{t('inquiriesNotifications.columns.companyName')}:</span>
                        <span className="ml-1">{record.company.name}</span>
                    </div>
                </div>
            )}

            <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                <div>
                    <span className={TYPOGRAPHY.label}>{t('inquiriesNotifications.columns.progressStatus')}:</span>
                    <span className="ml-1">{getStatusLabel(record.progressStatus)}</span>
                </div>
            </div>

            {record.responder && (
                <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                    <div>
                        <span className={TYPOGRAPHY.label}>{t('inquiriesNotifications.columns.responderName')}:</span>
                        <span className="ml-1">{record.responder.name}</span>
                    </div>
                </div>
            )}

            <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                <div>
                    <span className={TYPOGRAPHY.label}>{t('inquiriesNotifications.columns.recorderName')}:</span>
                    <span className="ml-1">{record.recorder?.name || t('detailPages.common.notSpecified')}</span>
                </div>
            </div>

            {record.resolutionDate && (
                <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                    <div>
                        <span className={TYPOGRAPHY.label}>{t('inquiriesNotifications.columns.resolutionDate')}:</span>
                        <span className="ml-1">{formatCardDate(record.resolutionDate)}</span>
                    </div>
                </div>
            )}

            <div className="col-span-full text-xs text-secondary-500 pt-2 border-t border-secondary-100">
                <span className="ml-4">
                    <span className={TYPOGRAPHY.label}>{t('company.lastUpdated')}:</span>
                    <span className="ml-1">{formatCardDate(record.updatedAt)}</span>
                </span>
            </div>
        </>
    );

    const renderConversation = (record: InquiryWithRelations) => (
        <ConversationSection
            key={`inquiry-conversation-${record.id}-${isOpen ? 'open' : 'closed'}`}
            parentType="inquiry"
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
            title={t('inquiriesNotifications.title')}
            icon={MessageSquare}
            renderHeader={renderHeader}
            renderContent={renderContent}
            renderDetails={renderDetails}
            renderConversation={renderConversation}
            getStatusBadges={getStatusBadges}
            getRecordId={(record) => record.id.toString()}
        />
    );
};
