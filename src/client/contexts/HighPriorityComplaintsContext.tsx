import React, { createContext, useContext, useState, useCallback } from 'react';
import { complaintService } from '../services/complaintService';
import { useLanguage } from './LanguageContext';
import { formatDateForTable } from '../utils/localization';
import type { ComplaintDetailWithRelations } from '../../shared/types';

interface HighPriorityComplaintsContextType {
  showHighPriorityDialog: boolean;
  highPriorityComplaints: ComplaintDetailWithRelations[];
  highPriorityLoading: boolean;
  highPriorityError: string | null;
  fetchAndShowHighPriorityComplaints: () => void;
  closeHighPriorityDialog: () => void;
}

const HighPriorityComplaintsContext = createContext<HighPriorityComplaintsContextType | undefined>(undefined);

export const useHighPriorityComplaints = () => {
  const context = useContext(HighPriorityComplaintsContext);
  if (context === undefined) {
    throw new Error('useHighPriorityComplaints must be used within a HighPriorityComplaintsProvider');
  }
  return context;
};

interface HighPriorityComplaintsProviderProps {
  children: React.ReactNode;
}

export const HighPriorityComplaintsProvider: React.FC<HighPriorityComplaintsProviderProps> = ({ children }) => {
  const { t } = useLanguage();
  const [showHighPriorityDialog, setShowHighPriorityDialog] = useState(false);
  const [highPriorityComplaints, setHighPriorityComplaints] = useState<ComplaintDetailWithRelations[]>([]);
  const [highPriorityLoading, setHighPriorityLoading] = useState(false);
  const [highPriorityError, setHighPriorityError] = useState<string | null>(null);

  const fetchAndShowHighPriorityComplaints = useCallback(async () => {
    try {
      setHighPriorityLoading(true);
      setHighPriorityError(null);

      const result = await complaintService.getHighPriorityComplaints();

      // Small helper to compute days passed and normalized fields for table rendering
      const calculateDaysPassed = (date: Date | string | null | undefined): number => {
        if (!date) return 0;
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return 0;
        const now = new Date();
        const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, diff);
      };

      const getProgressStatusText = (status?: string) => {
        const s = (status || '').toLowerCase();
        if (s === 'open') return t('status.open');
        if (s === 'closed') return t('status.closed');
        if (s === 'on_hold' || s === 'on-hold' || s === 'on hold') return t('status.onHold');
        return status || '';
      };

      const getProgressStatusColorClass = (status?: string) => {
        const s = (status || '').toLowerCase();
        if (s === 'open') return 'bg-red-100 text-red-800';
        if (s === 'closed') return 'bg-green-100 text-green-800';
        if (s === 'on_hold' || s === 'on-hold' || s === 'on hold') return 'bg-yellow-100 text-yellow-800';
        return 'bg-gray-100 text-gray-800';
      };

      const getUrgencyLevelText = (level?: string) => {
        const l = (level || '').toLowerCase();
        if (l === 'high') return t('complaintDetails.urgencyLevel.high');
        if (l === 'medium') return t('complaintDetails.urgencyLevel.medium');
        if (l === 'low') return t('complaintDetails.urgencyLevel.low');
        return level || '';
      };

      const getUrgencyLevelColorClass = (level?: string) => {
        const l = (level || '').toLowerCase();
        if (l === 'high') return 'bg-red-100 text-red-800';
        if (l === 'medium') return 'bg-yellow-100 text-yellow-800';
        if (l === 'low') return 'bg-green-100 text-green-800';
        return 'bg-gray-100 text-gray-800';
      };

      const transformed = (result.data || []).map((c) => ({
        ...c,
        // formatted date string for table cells (YYYY/MM/DD)
        formattedOccurrenceDate: formatDateForTable(c.dateOfOccurrence),
        // computed display text and color for progress status
        progressStatusText: getProgressStatusText(c.progressStatus as string | undefined),
        progressStatusColorClass: getProgressStatusColorClass(c.progressStatus as string | undefined),
        // computed days passed
        daysPassed: calculateDaysPassed(c.dateOfOccurrence),
        // flattened names
        responderName: c.responder?.name || '',
        companyName: c.company?.name || '',
        // urgency derived fields (kept for potential future use)
        urgencyLevelNormalized: c.urgencyLevel?.toLowerCase() || '',
        urgencyLevelText: getUrgencyLevelText(c.urgencyLevel as string | undefined),
        urgencyLevelColorClass: getUrgencyLevelColorClass(c.urgencyLevel as string | undefined),
      })) as ComplaintDetailWithRelations[];

      setHighPriorityComplaints(transformed);
      setShowHighPriorityDialog(true);
    } catch (error) {
      console.error('Failed to fetch high-priority complaints:', error);
      setHighPriorityError(t('highPriorityDialog.error'));
      setHighPriorityComplaints([]);
    } finally {
      setHighPriorityLoading(false);
    }
  }, [t]);

  const closeHighPriorityDialog = useCallback(() => {
    setShowHighPriorityDialog(false);
  }, []);

  const value: HighPriorityComplaintsContextType = {
    showHighPriorityDialog,
    highPriorityComplaints,
    highPriorityLoading,
    highPriorityError,
    fetchAndShowHighPriorityComplaints,
    closeHighPriorityDialog,
  };

  return (
    <HighPriorityComplaintsContext.Provider value={value}>
      {children}
    </HighPriorityComplaintsContext.Provider>
  );
};
