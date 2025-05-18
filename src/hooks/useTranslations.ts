
"use client";

import { useLanguage, type Language } from '@/contexts/LanguageContext';
import enTranslations from '@/locales/en.json';
import faTranslations from '@/locales/fa.json';
import { useCallback } from 'react';

type Translations = Record<string, string>;

const translations: Record<Language, Translations> = {
  en: enTranslations,
  fa: faTranslations,
};

export const useTranslations = () => {
  const { language } = useLanguage();

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const langTranslations = translations[language] || translations.en;
    let translation = langTranslations[key] || key; // Fallback to key if not found

    if (params) {
      Object.keys(params).forEach((paramKey) => {
        translation = translation.replace(`{${paramKey}}`, String(params[paramKey]));
      });
    }
    return translation;
  }, [language]); // Memoize t based on language

  return { t, currentLanguage: language };
};

    