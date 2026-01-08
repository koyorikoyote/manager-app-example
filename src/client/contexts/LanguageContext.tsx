import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import en from '../../shared/locales/en.json';
import ja from '../../shared/locales/ja.json';
import type { TranslationKey, TranslationVars, TranslationFunction } from '../../shared/types/translations';
import { apiClient } from '../services/apiClient';

export type Language = 'en' | 'ja';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationFunction;
  // Backward compatibility properties
  language: Language;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const resources = { en, ja } as const;

// Translation function with hierarchical key support and variable interpolation
function translate(
  lang: Language,
  key: TranslationKey,
  vars?: TranslationVars
): string {
  const keys = key.split('.');
  let result: unknown = resources[lang];
  let foundInCurrentLang = true;

  // Try to find the key in current language
  for (const k of keys) {
    if (typeof result === 'object' && result != null && k in result) {
      result = (result as Record<string, unknown>)[k];
    } else {
      foundInCurrentLang = false;
      break;
    }
  }

  // If not found in current language, try English fallback
  if (!foundInCurrentLang || typeof result !== 'string') {
    result = resources.en;
    for (const fallbackKey of keys) {
      if (typeof result === 'object' && result != null && fallbackKey in result) {
        result = (result as Record<string, unknown>)[fallbackKey];
      } else {
        // Log comprehensive warning in development mode for missing keys
        if (process.env.NODE_ENV === 'development') {
          console.warn(` Translation key missing: "${key}"`);
          console.warn(`   - Not found in current language: ${lang}`);
          console.warn(`   - Not found in fallback language: en`);
          console.warn(`   - Available keys at this level:`, Object.keys(result || {}));
        }
        return key; // Return key if not found in fallback either
      }
    }
  }

  if (typeof result === 'string') {
    // Log warning if key was found in fallback but not current language
    if (!foundInCurrentLang && process.env.NODE_ENV === 'development') {
      console.warn(` Translation key "${key}" missing in ${lang}, using English fallback`);
    }

    let text = result;
    // Variable interpolation with {{variable}} syntax
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(`{{${k}}}`, String(v));
      }
    }
    return text;
  }

  if (process.env.NODE_ENV === 'development') {
    console.warn(` Translation key "${key}" does not resolve to string, got:`, typeof result);
  }
  return key;
}

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Get the language from localStorage or default to browser language
  const [lang, setLangState] = useState<Language>(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return 'en'; // Default to English during SSR
    }

    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang === 'en' || savedLang === 'ja') {
      return savedLang;
    } else {
      // Detect browser language
      const browserLanguage = navigator.language.toLowerCase();
      if (browserLanguage.startsWith('ja')) {
        return 'ja';
      } else {
        return 'en';
      }
    }
  });

  // Load language from localStorage after hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('language') as Language;
      if (savedLang === 'en' || savedLang === 'ja') {
        setLangState(savedLang);
      } else {
        // Detect browser language
        const browserLanguage = navigator.language.toLowerCase();
        const detectedLang = browserLanguage.startsWith('ja') ? 'ja' : 'en';
        setLangState(detectedLang);
        localStorage.setItem('language', detectedLang);
      }
    }
  }, []);

  // Update language in state and localStorage
  const setLang = useCallback((newLang: Language) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', newLang);
    }
    setLangState(newLang);

    // Persist preference to backend if authenticated
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        const pref = newLang === 'ja' ? 'JA' : 'EN';
        // Fire-and-forget; ApiClient attaches the Authorization header
        apiClient.put('/users/me/language', { languagePreference: pref }).catch(() => { });
      }
    }
  }, []);

  const t: TranslationFunction = useCallback((key: TranslationKey, vars?: TranslationVars) => {
    return translate(lang, key, vars);
  }, [lang]);

  // Maintain backward compatibility with toggleLanguage for existing components
  const toggleLanguage = useCallback(() => {
    setLang(lang === 'en' ? 'ja' : 'en');
  }, [lang, setLang]);

  const value = useMemo(() => ({
    lang,
    setLang,
    t,
    // Backward compatibility properties
    language: lang,
    toggleLanguage
  }), [lang, setLang, t, toggleLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
