import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { PAGE_IDS, PAGE_TITLES, type PageId } from './content-types';
import { Layout } from './components/Layout';
import { useLang } from './lib/i18n';
import { storeGet, storeSet } from './lib/store';
import { Home } from './pages/Home';
import { GuidePage } from './pages/GuidePage';
import { ClassesPage } from './pages/ClassesPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { TrackerPage } from './pages/TrackerPage';

const KNOWN_IDS: readonly string[] = PAGE_IDS;

/**
 * Rewrites a legacy `#id` hash (no leading slash, e.g. `#classes` or `#class-templar`) to `#/id`.
 * HashRouter parses `window.location.hash` when it is constructed, so this must run before the
 * router mounts, main.tsx calls it ahead of the render call, and again on every `hashchange` so a
 * bare `#pageid` typed or followed while the app is already running gets corrected too (react-router's
 * hash history normalises the missing slash internally for routing purposes, which is why the page
 * still renders, but it never touches the address bar itself).
 *
 * Uses `history.replaceState` rather than assigning `window.location.hash` so the correction does not
 * add a new entry to browser history (the user never asked to navigate, we are just fixing the URL).
 */
export function normalizeLegacyHash(): void {
  const h = window.location.hash.slice(1);
  if (h && h !== '/' && !h.startsWith('/')) {
    const url = window.location.pathname + window.location.search + '#/' + h;
    window.history.replaceState(window.history.state, '', url);
  }
}

function titleFor(pageId: string, T: (text: string) => string): string {
  const known: PageId = KNOWN_IDS.includes(pageId) ? (pageId as PageId) : 'home';
  return T(PAGE_TITLES[known]);
}

/** Restores the last visited page on a bare load, persists the current page id, and sets document.title. */
function RouteEffects() {
  const location = useLocation();
  const navigate = useNavigate();
  const { T } = useLang();

  useEffect(() => {
    if (location.pathname === '/') {
      const last = storeGet('page', 'home');
      if (last && last !== 'home' && KNOWN_IDS.includes(last)) {
        navigate('/' + last, { replace: true });
      }
    }
    // Only ever on the very first load of the app, not on later navigations to "/".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const pageId = location.pathname === '/' ? 'home' : location.pathname.slice(1);
    storeSet('page', pageId);
    const brand = T('AION 2 Beginner Compendium');
    document.title = pageId === 'home' ? brand : `${titleFor(pageId, T)} · ${brand}`;
  }, [location.pathname, T]);

  // Every page change starts at the top, unless a search hit asked for a specific card
  // (GuideBody scrolls to it after the content has rendered).
  useEffect(() => {
    const state = location.state as { cardId?: string } | null;
    if (!state?.cardId) window.scrollTo({ top: 0 });
  }, [location.pathname, location.state]);

  return null;
}

function PageRoute() {
  const { pageId } = useParams<{ pageId: string }>();
  if (!pageId || pageId === 'home' || !KNOWN_IDS.includes(pageId)) {
    return <Navigate to="/" replace />;
  }
  if (pageId === 'roadmap') return <RoadmapPage />;
  if (pageId === 'checklist') return <TrackerPage />;
  if (pageId === 'classes') return <ClassesPage />;
  return <GuidePage />;
}

export default function App() {
  return (
    <Layout>
      <RouteEffects />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:pageId" element={<PageRoute />} />
      </Routes>
    </Layout>
  );
}
