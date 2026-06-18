import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { translations, type Lang, type TranslationKey } from './translations';

interface LanguageContextValue {
  lang: Lang;
  t: (key: TranslationKey) => string;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem('css-arena-lang') as Lang) ?? 'en';
  });

  const t = useCallback((key: TranslationKey): string => translations[lang][key], [lang]);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === 'en' ? 'es' : 'en';
      localStorage.setItem('css-arena-lang', next);
      return next;
    });
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useI18n must be used inside LanguageProvider');
  return ctx;
}
