import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface LanguageToggleProps {
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ className = '' }) => {
  const { lang, setLang, t } = useLanguage();

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'ja' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`
        flex items-center justify-between w-full px-3 py-2 text-sm
        text-gray-700 hover:bg-gray-100 rounded-md transition-colors
        ${className}
      `}
      aria-label={t('navigation.language')}
    >
      <span>{t('navigation.language')}</span>
      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
        {lang.toUpperCase()}
      </span>
    </button>
  );
};

// Alternative compact version for mobile or small spaces
export const LanguageToggleCompact: React.FC<LanguageToggleProps> = ({ className = '' }) => {
  const { lang, setLang } = useLanguage();

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'ja' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`
        px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 
        rounded-md transition-colors border border-gray-300
        ${className}
      `}
      aria-label="Toggle Language"
    >
      {lang.toUpperCase()}
    </button>
  );
};