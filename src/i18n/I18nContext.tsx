import React, { createContext, useContext, useState } from 'react';
import { Language, LANGUAGE_NAMES, TRANSLATIONS, TranslationKey, detectBrowserLanguage } from './translations';
import { Globe } from 'lucide-react';

const STORAGE_LANG_KEY = 'stand_consult_lang_v1';

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY) as Language;
      if (saved && TRANSLATIONS[saved]) return saved;
    } catch {}
    return detectBrowserLanguage();
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try { localStorage.setItem(STORAGE_LANG_KEY, newLang); } catch {}
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.fr;
    let text = dict[key] || TRANSLATIONS.fr[key] || String(key);
    if (params) {
      Object.keys(params).forEach((paramKey) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(params[paramKey]));
      });
    }
    return text;
  };

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within an I18nProvider');
  return context;
};

export const LanguageSelector: React.FC = () => {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const languages: Language[] = ['fr', 'en', 'es', 'de'];

  return (
    <div className="lang-wrap">
      <button className="lang-btn" onClick={() => setOpen(!open)}>
        <Globe size={15} color="var(--accent)" />
        <span>{LANGUAGE_NAMES[lang].flag} {lang.toUpperCase()}</span>
      </button>
      {open && (
        <div className="lang-dropdown">
          {languages.map((l) => (
            <button
              key={l}
              className={`lang-item ${l === lang ? 'lang-item--active' : ''}`}
              onClick={() => { setLang(l); setOpen(false); }}
            >
              {LANGUAGE_NAMES[l].flag} {LANGUAGE_NAMES[l].name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
