'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import t, { Lang } from '@/lib/translations';

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  T: typeof t['en'];
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const VALID_LANGS: Lang[] = ['en', 'fr', 'rw'];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('nmo_lang') as Lang | null;
    if (saved && VALID_LANGS.includes(saved)) setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('nmo_lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, T: t[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
