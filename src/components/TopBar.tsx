import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronsDownUp, ChevronsUpDown, Menu, Quote, Search } from 'lucide-react';
import { PAGE_IDS, PAGE_TITLES, type PageId } from '../content-types';
import { useLang } from '../lib/i18n';
import { usePageActions } from '../lib/pageActions';
import { storeGet, storeSet } from '../lib/store';
import { LanguagePicker } from './LanguagePicker';
import { SearchDialog } from './SearchDialog';
import { ThemeToggle } from './ThemeToggle';

interface TopBarProps {
  onBurgerClick: () => void;
}

export function TopBar({ onBurgerClick }: TopBarProps) {
  const { T } = useLang();
  const location = useLocation();
  const { expandAll, collapseAll } = usePageActions();

  const [compact, setCompact] = useState<boolean>(() => storeGet('compact', true));
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('compact', compact);
  }, [compact]);

  // Close the search dialog on route change so it never stays open (or reopens showing a stale
  // query/hits) across navigation, including the navigation triggered by picking a hit.
  useEffect(() => {
    setSearchOpen(false);
  }, [location.pathname]);

  // Command-palette shortcuts: Ctrl/Cmd+K always opens it; "/" opens it unless the user is
  // already typing somewhere (an input, textarea, select, or a contentEditable region).
  useEffect(() => {
    function onGlobalKeyDown(e: KeyboardEvent) {
      const isCombo = (e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey);
      if (isCombo) {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (e.key !== '/') return;
      const active = document.activeElement as HTMLElement | null;
      const tag = (active?.tagName ?? '').toLowerCase();
      if (/input|textarea|select/.test(tag) || active?.isContentEditable) return;
      e.preventDefault();
      setSearchOpen(true);
    }
    document.addEventListener('keydown', onGlobalKeyDown);
    return () => document.removeEventListener('keydown', onGlobalKeyDown);
  }, []);

  function toggleCompact() {
    setCompact((prev) => {
      const next = !prev;
      storeSet('compact', next);
      return next;
    });
  }

  const rawPageId = location.pathname === '/' ? 'home' : location.pathname.slice(1);
  const pageId: PageId = (PAGE_IDS as readonly string[]).includes(rawPageId)
    ? (rawPageId as PageId)
    : 'home';
  const title = T(PAGE_TITLES[pageId]);

  return (
    <header className="top">
      <button className="burger" aria-label={T('Menu')} onClick={onBurgerClick}>
        <Menu />
      </button>
      <div className="crumb">
        {pageId === 'home' ? (
          <b>{T('Home')}</b>
        ) : (
          <>
            {T('Home')} / <b>{title}</b>
          </>
        )}
      </div>
      <button className="search-trigger" onClick={() => setSearchOpen(true)}>
        <Search />
        <span className="label">{T('Search everything: stigma, energy, founder, templar...')}</span>
        <kbd>Ctrl K</kbd>
      </button>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <div className="tools">
        <LanguagePicker />
        <ThemeToggle />
        <button
          className={compact ? 'icon-btn on' : 'icon-btn'}
          title={T('Toggle between numbered footnote markers and full source names')}
          onClick={toggleCompact}
        >
          <Quote />
          <span className="label">{compact ? T('Sources: compact') : T('Sources: full names')}</span>
        </button>
        <button className="icon-btn" title={T('Expand all')} aria-label={T('Expand all')} onClick={expandAll}>
          <ChevronsUpDown />
        </button>
        <button className="icon-btn" title={T('Collapse all')} aria-label={T('Collapse all')} onClick={collapseAll}>
          <ChevronsDownUp />
        </button>
      </div>
    </header>
  );
}
