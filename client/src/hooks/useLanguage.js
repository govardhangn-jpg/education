/**
 * useLanguage — app-wide language management hook
 *
 * Usage:
 *   const { lang, setLang, t, isRTL, langMeta } = useLanguage();
 *
 * The chosen language is persisted in localStorage so it survives reloads.
 */
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { t as translate, getLangMeta, isRTL as checkRTL, SUPPORTED_LANGUAGES } from '../utils/i18n';

const LS_KEY = 'samarthaa_lang';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem(LS_KEY) || 'en'; }
    catch { return 'en'; }
  });

  const setLang = useCallback((code) => {
    setLangState(code);
    try { localStorage.setItem(LS_KEY, code); } catch {}
    // Set document dir for RTL support
    document.documentElement.dir = checkRTL(code) ? 'rtl' : 'ltr';
    document.documentElement.lang = code;
  }, []);

  // Apply on mount
  useEffect(() => {
    document.documentElement.dir = checkRTL(lang) ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const tFn   = useCallback((key) => translate(key, lang), [lang]);
  const rtl   = checkRTL(lang);
  const meta  = getLangMeta(lang);

  const value = {
    lang,
    setLang,
    t: tFn,
    isRTL: rtl,
    langMeta: meta,
    languages: SUPPORTED_LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
