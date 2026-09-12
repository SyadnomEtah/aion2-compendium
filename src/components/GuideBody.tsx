import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PAGE_IDS, PAGE_TITLES, type CardBlock, type PageData, type PageId } from '../content-types';
import { fetchPage } from '../lib/content';
import { useLang } from '../lib/i18n';
import { useRegisterPageHandlers } from '../lib/pageActions';
import { storeGet, storeSet } from '../lib/store';
import { scrollToCard } from '../lib/scrollTo';
import { useRegisterToc } from '../lib/tocActions';
import { BlockRenderer } from './BlockRenderer';
import { Toc } from './Toc';

interface GuideBodyProps {
  pageId: string;
  /** extra JSX rendered before the fetched blocks, inside the same pagebody wrapper (ClassesPage's intro/tiles/"Compare" title). */
  before?: ReactNode;
}

/** Every guide page in reading order, for the bottom pager. Home has no prior/next guide page. */
const PAGER_ORDER: readonly PageId[] = PAGE_IDS.filter((id) => id !== 'home');

const INTRO_LEAD_RE = /<p class="lead">([\s\S]*?)<\/p>/;

/**
 * Fetches a PageData for the current language and page id, and renders its blocks. Shared by
 * GuidePage and ClassesPage so the fetch/collapse/TOC/search-scroll logic lives in one place.
 *
 * Also owns, for every page it renders: the page-head (title + intro lead line), the "On this
 * page" TOC (published to Layout's right rail at >=1280px, plus a `.toc-drop` dropdown for
 * narrower viewports), and the prev/next pager at the bottom.
 */
export function GuideBody({ pageId, before }: GuideBodyProps) {
  const { lang, T } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<PageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [sourcesCollapsed, setSourcesCollapsed] = useState(true);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [classCompact, setClassCompact] = useState<boolean>(() => storeGet('classCompact', false));

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    setCollapsed({});
    setSourcesCollapsed(true);
    fetchPage(lang, pageId).then(
      (d) => {
        if (!cancelled) setData(d);
      },
      (e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [lang, pageId, reloadNonce]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pageId]);

  const sourcesId = `${pageId}-sources`;

  // Search hits navigate here with { cardId } in router state: expand the target and flash it.
  useEffect(() => {
    const targetId = (location.state as { cardId?: string } | null)?.cardId;
    if (!targetId || !data) return undefined;
    if (targetId === sourcesId) setSourcesCollapsed(false);
    else setCollapsed((prev) => ({ ...prev, [targetId]: false }));
    setFlashId(targetId);
    const t1 = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
    const t2 = window.setTimeout(() => setFlashId(null), 2500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, data]);

  const cardBlocks = useMemo(
    () => (data ? (data.blocks.filter((b) => b.type === 'card') as CardBlock[]) : []),
    [data],
  );
  const hasToc = cardBlocks.length >= 4;

  const handlers = useMemo(
    () => ({
      expandAll: () => {
        setCollapsed({});
        setSourcesCollapsed(false);
      },
      collapseAll: () => {
        const next: Record<string, boolean> = {};
        cardBlocks.forEach((c) => {
          next[c.id] = true;
        });
        setCollapsed(next);
        setSourcesCollapsed(true);
      },
    }),
    [cardBlocks],
  );
  useRegisterPageHandlers(handlers);

  const handleTocNavigate = useCallback(
    (id: string) => {
      if (id === sourcesId) setSourcesCollapsed(false);
      else setCollapsed((prev) => ({ ...prev, [id]: false }));
      window.setTimeout(() => scrollToCard(id, 70), 30);
    },
    [sourcesId],
  );

  // Publishes this page's TOC up to Layout, which renders the sticky right rail (>=1280px).
  // Below 1280px the rail is hidden and a `.toc-drop` dropdown is rendered inline instead.
  const tocData = useMemo(
    () => (hasToc ? { cards: cardBlocks, onNavigate: handleTocNavigate } : null),
    [hasToc, cardBlocks, handleTocNavigate],
  );
  useRegisterToc(tocData);

  function toggleClassCompact() {
    setClassCompact((prev) => {
      const next = !prev;
      storeSet('classCompact', next);
      return next;
    });
  }

  if (error) {
    return (
      <div className="intro">
        <p className="lead">
          {T('Could not load this page ({msg}). Reload to try again.', { msg: error })}{' '}
          <button className="btn" onClick={() => setReloadNonce((n) => n + 1)}>
            {T('Reload')}
          </button>
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="intro">
        <p className="lead">{T('Loading')}</p>
      </div>
    );
  }

  const classNames = ['page', 'active'];
  if (data.single) classNames.push('single');
  if (data.classId && classCompact) classNames.push('compact');

  const knownId: PageId = (PAGE_IDS as readonly string[]).includes(pageId) ? (pageId as PageId) : 'home';
  const pageTitle = T(PAGE_TITLES[knownId]);

  // The plain guide pages (Start Here, Priorities, ..., Sources) open with an `<div class="intro">`
  // html block whose lead paragraph the page-head repeats; class pages (classHead first) and the
  // classes picker (card first, its own `before` header) do not have one.
  const firstBlock = data.blocks[0];
  const introBlock =
    firstBlock && firstBlock.type === 'html' && /class="intro"/.test(firstBlock.html) ? firstBlock : null;
  const leadMatch = introBlock ? INTRO_LEAD_RE.exec(introBlock.html) : null;
  const bodyBlocks = introBlock ? data.blocks.slice(1) : data.blocks;

  const orderIdx = PAGER_ORDER.indexOf(knownId);
  const prevId = orderIdx > 0 ? PAGER_ORDER[orderIdx - 1] : null;
  const nextId = orderIdx >= 0 && orderIdx < PAGER_ORDER.length - 1 ? PAGER_ORDER[orderIdx + 1] : null;

  const rendered = (
    <BlockRenderer
      blocks={bodyBlocks}
      pageId={pageId}
      classId={data.classId}
      collapsed={collapsed}
      onToggleCard={(id) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))}
      sourcesCollapsed={sourcesCollapsed}
      onToggleSources={() => setSourcesCollapsed((v) => !v)}
      flashId={flashId}
      classCompact={classCompact}
      onToggleClassCompact={toggleClassCompact}
    />
  );

  return (
    <section className={classNames.join(' ')} data-title={data.title} data-class={data.classId}>
      <div className="pagebody">
        <div className="page-head">
          <h1 className="page-title">{pageTitle}</h1>
          {leadMatch ? <p className="lead" dangerouslySetInnerHTML={{ __html: leadMatch[1] }} /> : null}
        </div>
        {hasToc ? (
          <details className="toc-drop">
            <summary>{T('On this page')}</summary>
            <Toc cards={cardBlocks} onNavigate={handleTocNavigate} showLabel={false} />
          </details>
        ) : null}
        {before}
        {rendered}
        <nav className="pager">
          {prevId ? (
            <button type="button" className="btn pager-prev" onClick={() => navigate('/' + prevId)}>
              {'← ' + T('Previous') + ': ' + T(PAGE_TITLES[prevId])}
            </button>
          ) : (
            <span />
          )}
          {nextId ? (
            <button type="button" className="btn pager-next" onClick={() => navigate('/' + nextId)}>
              {T('Next') + ': ' + T(PAGE_TITLES[nextId]) + ' →'}
            </button>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </section>
  );
}
