import { useId, useState, type KeyboardEvent } from 'react';
import { Globe } from 'lucide-react';
import { LANGUAGES, useLang, type Lang } from '../lib/i18n';

/**
 * Single language picker: Globe icon + current language label, opening a small keyboard-operable
 * menu. Replaces the old sidebar-footer LangToggle and top-bar LangToggle (there was one of each).
 * Options come from LANGUAGES (src/lib/i18n.tsx); adding a language needs no changes here.
 */
export function LanguagePicker({ className }: { className?: string }) {
  const { lang, setLang, T } = useLang();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  function choose(code: Lang) {
    setLang(code);
    setOpen(false);
  }

  function onTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'Escape') setOpen(false);
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
    }
  }

  return (
    <div
      className={className ? 'lang-picker ' + className : 'lang-picker'}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        type="button"
        className="icon-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={T('Language')}
        title={T('Language')}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
      >
        <Globe />
        <span className="label">{current.label}</span>
      </button>
      {open ? (
        <ul className="lang-menu" id={menuId} role="listbox" aria-label={T('Language')}>
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={l.code === lang}
                className={l.code === lang ? 'on' : ''}
                onClick={() => choose(l.code)}
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
