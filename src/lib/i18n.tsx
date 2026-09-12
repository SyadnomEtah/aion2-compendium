// Language context. UI strings are looked up in src/generated/ui.pl.json by their exact English text.
// Guide content is translated at build time (see ARCHITECTURE.md), so this only covers JSX strings.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { storeGet, storeSet } from './store';
import uiPl from '../generated/ui.pl.json';

const PL: Record<string, string> = uiPl as Record<string, string>;

/** Every language the site supports. Add a language by adding one entry here plus a content folder. */
export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'pl', label: 'Polski' },
] as const;

export type Lang = (typeof LANGUAGES)[number]['code'];

export type Vars = Record<string, string | number>;

function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text;
  let out = text;
  for (const k of Object.keys(vars)) out = out.split('{' + k + '}').join(String(vars[k]));
  return out;
}

/** translate an English UI string; falls back to the English text */
export function translate(lang: Lang, text: string, vars?: Vars): string {
  const hit = lang === 'pl' ? PL[text] : undefined;
  return interpolate(hit ?? text, vars);
}

interface LangCtx {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** plain text translation */
  T: (text: string, vars?: Vars) => string;
  /** translation that may contain inline HTML; render with dangerouslySetInnerHTML */
  TH: (html: string, vars?: Vars) => { __html: string };
}

const Ctx = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = storeGet<string>('lang', 'en');
    return (LANGUAGES.some((l) => l.code === stored) ? stored : 'en') as Lang;
  });

  const setLang = useCallback((next: Lang) => {
    storeSet('lang', next);
    setLangState(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<LangCtx>(() => ({
    lang,
    setLang,
    T: (text, vars) => translate(lang, text, vars),
    TH: (html, vars) => ({ __html: translate(lang, html, vars) }),
  }), [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLang outside LangProvider');
  return ctx;
}
