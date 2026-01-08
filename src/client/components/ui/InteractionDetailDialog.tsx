import React from 'react';
import { MessageSquare, Calendar, User } from 'lucide-react';
import { StandardDetailDialog, type StatusBadge } from './StandardDetailDialog';
import { TruncatedText } from './TruncatedText';
import {
    TYPOGRAPHY
} from './cardStyles';
import {
    getInteractionTypeColor,
    getInteractionStatusColor,
    formatCardDate,
    getDisplayValue
} from './cardUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import type { InteractionRecord } from '../../../shared/types';
import { ConversationSection } from '../conversation/ConversationSection';

interface InteractionDetailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    record: InteractionRecord | null;
    onEdit: (record: InteractionRecord) => void;
    onDelete: (id: string) => void;
    getTypeLabel: (type: InteractionRecord['type']) => string;
    getStatusLabel: (status: InteractionRecord['status']) => string;
}

export const InteractionDetailDialog: React.FC<InteractionDetailDialogProps> = ({
    isOpen,
    onClose,
    record,
    onEdit,
    onDelete,
    getTypeLabel,
    getStatusLabel
}) => {
    const { t } = useLanguage();

    const getMeansDisplayLabel = (means: string): string => {
        const map: Record<string, string> = {
            'FACE_TO_FACE': t('interactions.communicationMethods.faceToFace'),
            'ONLINE': t('interactions.communicationMethods.online'),
            'PHONE': t('interactions.communicationMethods.phone'),
            'EMAIL': t('interactions.communicationMethods.email'),
        };
        return (typeof means === 'string' && map[means]) ? map[means] : means;
    };

    const getStatusBadges = (record: InteractionRecord): StatusBadge[] => [
        {
            text: getTypeLabel(record.type),
            className: getInteractionTypeColor(record.type)
        },
        {
            text: getStatusLabel(record.status),
            className: getInteractionStatusColor(record.status || 'open')
        }
    ];

    const renderHeader = (record: InteractionRecord) => (
        <>
            {/* Name field - prominently displayed */}
            <h3 className={TYPOGRAPHY.title}>
                {getDisplayValue(record.name)}
            </h3>

            {/* Person Concerned field */}
            <p className={TYPOGRAPHY.subtitle}>
                {t('interactions.columns.personConcerned')}: {getDisplayValue(record.personConcerned)}
            </p>

            {/* Title field - secondary heading */}
            <h4 className="text-sm font-medium text-secondary-700 mb-1 truncate">
                {getDisplayValue(record.title)}
            </h4>
        </>
    );

    const renderContent = (record: InteractionRecord) => (
        <div className="space-y-4">
            {/* Description Content - Standardized container */}
            <div className="bg-secondary-50 p-4 rounded-lg">
                <h5 className="text-sm font-medium text-secondary-700 mb-2 flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>{t('interactions.columns.description')}</span>
                </h5>
                <TruncatedText
                    text={record.description || ''}
                    maxLength={500}
                    className="text-secondary-600 leading-relaxed"
                />
            </div>

            {/* Location and Communication Method - if available */}
            {(record.location || record.means) && (
                <div className="bg-secondary-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-secondary-700 mb-2 flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{t('interactions.sections.communicationDetails')}</span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {record.location && (
                            <div>
                                <span className="font-medium">{t('interactions.columns.location')}:</span>
                                <span className="ml-1">{record.location}</span>
                            </div>
                        )}
                        {record.means && (
                            <div>
                                <span className="font-medium">{t('interactions.columns.means')}:</span>
                                <span className="ml-1">{getMeansDisplayLabel(record.means)}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Response Details - if available */}
            {record.responseDetails && (
                <div className="bg-secondary-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-secondary-700 mb-2 flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{t('interactions.columns.responseDetails')}</span>
                    </h5>
                    <TruncatedText
                        text={record.responseDetails}
                        maxLength={300}
                        className="text-secondary-600 leading-relaxed"
                    />
                </div>
            )}
        </div>
    );

    const renderDetails = (record: InteractionRecord) => (
        <>
            <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                <div>
                    <span className={TYPOGRAPHY.label}>{t('interactions.columns.date')}:</span>
                    <span className="ml-1">{formatCardDate(record.date)}</span>
                </div>
            </div>

            <div>
                <span className={TYPOGRAPHY.label}>{t('interactions.columns.daysPassed')}:</span>
                <span className="ml-1">{getDisplayValue(record.daysPassed?.toString())}</span>
            </div>

            <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                <div>
                    <span className={TYPOGRAPHY.label}>{t('interactions.columns.personInvolved')}:</span>
                    <span className="ml-1">{getDisplayValue(record.personInvolved?.name)}</span>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                <div>
                    <span className={TYPOGRAPHY.label}>{t('interactions.columns.userInCharge')}:</span>
                    <span className="ml-1">{getDisplayValue(record.userInCharge?.name)}</span>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                <div>
                    <span className={TYPOGRAPHY.label}>{t('interactions.columns.createdBy')}:</span>
                    <span className="ml-1">{getDisplayValue(record.creator?.name)}</span>
                </div>
            </div>

            <div className="col-span-full text-xs text-secondary-500 pt-2 border-t border-secondary-100">
                <span className={TYPOGRAPHY.label}>{t('interactions.columns.updatedAt')}:</span>
                <span className="ml-1">{formatCardDate(record.updatedAt)}</span>
            </div>
        </>
    );

    const renderConversation = (record: InteractionRecord) => (
        <ConversationSection
            key={`interaction-conversation-${record.id}-${isOpen ? 'open' : 'closed'}`}
            parentType="interaction"
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
            title={t('interactions.recordDetails')}
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
