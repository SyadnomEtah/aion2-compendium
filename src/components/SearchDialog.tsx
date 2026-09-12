// Command-palette search dialog. Reuses the search logic that used to live inline in TopBar.tsx:
// same debounce, same title-match-first ranking, same snippet highlighting and keyboard navigation,
// now presented as a full-width modal grouped by page instead of an anchored dropdown.

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { SearchEntry } from '../content-types';
import { fetchSearchIndex } from '../lib/content';
import { useLang } from '../lib/i18n';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

function escHtml(s: string): string {
  return s.replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m] as string);
}

function snippet(text: string, term: string): string {
  const i = text.indexOf(term);
  if (i < 0) return '';
  const s = Math.max(0, i - 60);
  const e = Math.min(text.length, i + term.length + 80);
  return (
    (s > 0 ? '…' : '') +
    escHtml(text.slice(s, i)) +
    '<em>' +
    escHtml(text.slice(i, i + term.length)) +
    '</em>' +
    escHtml(text.slice(i + term.length, e)) +
    (e < text.length ? '…' : '')
  );
}

interface Group {
  pageTitle: string;
  hits: { hit: SearchEntry; flatIndex: number }[];
}

function groupByPage(hits: SearchEntry[]): Group[] {
  const groups: Group[] = [];
  const byTitle = new Map<string, Group>();
  hits.forEach((hit, flatIndex) => {
    let g = byTitle.get(hit.pageTitle);
    if (!g) {
      g = { pageTitle: hit.pageTitle, hits: [] };
      byTitle.set(hit.pageTitle, g);
      groups.push(g);
    }
    g.hits.push({ hit, flatIndex });
  });
  return groups;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const { T, lang } = useLang();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<SearchEntry[]>([]);
  const [hits, setHits] = useState<SearchEntry[]>([]);
  const [sel, setSel] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    fetchSearchIndex(lang).then(setIndex);
  }, [open, lang]);

  // Clear query, hits and selection whenever the dialog opens OR closes, so it never shows a
  // stale query/results from the last time it was open. Only the open case also needs to focus
  // the input (once it exists in the DOM).
  useEffect(() => {
    setQuery('');
    setHits([]);
    setSel(0);
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  function runSearch(term: string, all: SearchEntry[]) {
    setSel(0);
    const q = term.trim().toLowerCase();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const matches = all.filter((e) => e.text.includes(q));
    const byTitle = matches.filter((e) => e.title.toLowerCase().includes(q));
    const rest = matches.filter((e) => !byTitle.includes(e));
    setHits([...byTitle, ...rest].slice(0, 40));
  }

  function onInputChange(v: string) {
    setQuery(v);
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => runSearch(v, index), 120);
  }

  function openHit(i: number) {
    const h = hits[i];
    if (!h) return;
    onClose();
    navigate('/' + h.page, { state: { cardId: h.cardId, nonce: Date.now() } });
  }

  function onKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      setSel((s) => Math.min(hits.length - 1, s + 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setSel((s) => Math.max(0, s - 1));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      openHit(sel < 0 ? 0 : sel);
    } else if (e.key === 'Tab') {
      // Focus trap: the input is the only tabbable element in the dialog besides result buttons,
      // and results aren't tab-stops (mouse/keyboard-arrow only), so Tab always stays put here.
      e.preventDefault();
    }
  }

  const term = query.trim().toLowerCase();
  const groups = useMemo(() => groupByPage(hits), [hits]);

  if (!open) return null;

  return (
    <div
      className="search-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="search-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={T('Search')}
      >
        <div className="sd-field">
          <Search />
          <input
            ref={inputRef}
            type="text"
            placeholder={T('Search everything: stigma, energy, founder, templar...')}
            autoComplete="off"
            value={query}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="sd-results">
          {groups.length ? (
            groups.map((g) => (
              <div key={g.pageTitle}>
                <div className="sd-group">{g.pageTitle}</div>
                {g.hits.map(({ hit, flatIndex }) => (
                  <button
                    key={hit.page + ':' + hit.cardId}
                    className={flatIndex === sel ? 'sd-hit sel' : 'sd-hit'}
                    onMouseEnter={() => setSel(flatIndex)}
                    onClick={() => openHit(flatIndex)}
                  >
                    <strong>{hit.title}</strong>
                    <small dangerouslySetInnerHTML={{ __html: snippet(hit.text, term) }} />
                  </button>
                ))}
              </div>
            ))
          ) : term.length >= 2 ? (
            <div className="sd-none">{T('No matches. Try another term.')}</div>
          ) : (
            <div className="sd-hint">{T('Type at least 2 characters to search the whole guide.')}</div>
          )}
        </div>
      </div>
    </div>
  );
}
