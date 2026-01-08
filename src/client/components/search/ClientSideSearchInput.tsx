import React, { useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../ui/Input';
import { useLanguage } from '../../contexts/LanguageContext';
import { useMobileDetection } from '../../hooks/useTouch';

interface ClientSideSearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    'aria-label'?: string;
}

export const ClientSideSearchInput: React.FC<ClientSideSearchInputProps> = ({
    value,
    onChange,
    placeholder,
    className,
    'aria-label': ariaLabel
}) => {
    const { t } = useLanguage();
    const { isMobile } = useMobileDetection();

    const handleClear = useCallback(() => {
        onChange('');
    }, [onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // For client-side search, no need to trigger additional search on Enter
            // The onChange already handles immediate filtering
        }
    }, []);

    return (
        <div className={className} role="search">
            <div className="relative">
                <Input
                    type="search"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || t('search.keyword')}
                    aria-label={ariaLabel || 'Search input'}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    startIcon={<Search className="h-4 w-4" aria-hidden="true" />}
                    endIcon={
                        value && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className={`p-1 hover:bg-secondary-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20 touch-target ${isMobile ? 'p-2 min-w-[40px] min-h-[40px]' : ''}`}
                                aria-label={t('search.clearSearch')}
                            >
                                <X className={`h-4 w-4 ${isMobile ? 'h-5 w-5' : ''}`} />
                            </button>
                        )
                    }
                    className={`pr-12 ${isMobile ? 'pr-16' : ''}`}
                    size={isMobile ? 'default' : 'compact'}
                />
            </div>
        </div>
    );
};