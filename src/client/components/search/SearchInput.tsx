import React, { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';

import { useMobileDetection } from '../../hooks/useTouch';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onSearch,
  placeholder,
  className,
  'aria-label': ariaLabel
}) => {
  const { t } = useLanguage();
  const { isMobile } = useMobileDetection();
  const [_isFocused, setIsFocused] = useState(false);

  // No automatic search - only on confirmation

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value.trim());
  }, [value, onSearch]);

  const handleClear = useCallback(() => {
    onChange('');
    onSearch('');
  }, [onChange, onSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch(value.trim());
    }
  }, [value, onSearch]);

  return (
    <form onSubmit={handleSubmit} className={className} role="search">
      <div className="relative">
        <Input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
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
        <Button
          type="submit"
          size="sm"
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-3 touch-target ${isMobile ? 'h-10 px-4 right-3' : ''}`}
          disabled={!value.trim()}
          aria-label="Submit search"
        >
          <Search className={`h-4 w-4 ${isMobile ? 'h-5 w-5' : ''}`} />
        </Button>
      </div>
    </form>
  );
};