
"use client";

import type { ReactNode } from 'react';
import { createContext, useState, useEffect, useContext, useCallback } from 'react';

export type Language = 'en' | 'fa';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'noteWiseLanguage';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');

  useEffect(() => {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
    if (storedLanguage && ['en', 'fa'].includes(storedLanguage)) {
      setLanguageState(storedLanguage);
      setDir(storedLanguage === 'fa' ? 'rtl' : 'ltr');
      document.documentElement.lang = storedLanguage;
      document.documentElement.dir = storedLanguage === 'fa' ? 'rtl' : 'ltr';
    } else {
      // Set default if nothing stored or invalid
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    const newDir = lang === 'fa' ? 'rtl' : 'ltr';
    setDir(newDir);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = newDir;
  }, []);

  const value = { language, setLanguage, dir };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
