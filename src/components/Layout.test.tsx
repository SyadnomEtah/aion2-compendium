// Regression test for the mobile off-canvas sidebar: clicking the burger button in TopBar must
// toggle the `open` class on `.side` and the scrim
// (`sideEl.classList.toggle('open')` / `scrim.classList.toggle('open')`).

import { fireEvent, render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Layout } from './Layout';
import type { CardBlock, PageData } from '../content-types';
import { LangProvider } from '../lib/i18n';
import { PageActionsProvider } from '../lib/pageActions';
import { TocProvider, useRegisterToc, type TocData } from '../lib/tocActions';
import { ToastProvider } from './Toast';

const minimalPage: PageData = { id: 'roadmap', title: 'Progression roadmap', single: false, blocks: [] };

const TOC_CARDS: CardBlock[] = [
  { type: 'card', id: 'c1', title: 'Card one', titleEn: 'Card one', headExtrasHtml: '', bodyHtml: '', tags: '' },
];

// Module-level (stable) reference: useRegisterToc's effect keys off this object's identity, so a
// fresh literal recreated every render would re-publish on every render and (since publishing
// changes TocProvider's context value, which this component itself consumes) loop forever.
const TOC_DATA: TocData = { cards: TOC_CARDS, onNavigate: () => {} };

/** Publishes a fixed "On this page" TOC so Layout renders the right-hand rail, the way GuideBody does. */
function PublishToc() {
  useRegisterToc(TOC_DATA);
  return null;
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(url.includes('search.json') || url.includes('tasks.json') ? [] : minimalPage),
      } as Response),
    ),
  );
});

function renderLayout({ withToc = false } = {}) {
  return render(
    <HashRouter>
      <LangProvider>
        <ToastProvider>
          <PageActionsProvider>
            <TocProvider>
              {withToc ? <PublishToc /> : null}
              <Layout>
                <div>page content</div>
              </Layout>
            </TocProvider>
          </PageActionsProvider>
        </ToastProvider>
      </LangProvider>
    </HashRouter>,
  );
}

describe('Layout mobile sidebar', () => {
  it('clicking the burger opens the off-canvas sidebar and scrim, closing again toggles both off', () => {
    renderLayout();

    const side = document.getElementById('side')!;
    const scrim = document.querySelector('.scrim')!;
    expect(side.className).not.toContain('open');
    expect(scrim.className).not.toContain('open');

    fireEvent.click(screen.getByLabelText('Menu'));
    expect(side.className).toContain('open');
    expect(scrim.className).toContain('open');

    fireEvent.click(screen.getByLabelText('Menu'));
    expect(side.className).not.toContain('open');
    expect(scrim.className).not.toContain('open');
  });

  it('clicking the scrim closes the sidebar', () => {
    renderLayout();

    fireEvent.click(screen.getByLabelText('Menu'));
    const side = document.getElementById('side')!;
    const scrim = document.querySelector('.scrim')!;
    expect(side.className).toContain('open');

    fireEvent.click(scrim);
    expect(side.className).not.toContain('open');
    expect(scrim.className).not.toContain('open');
  });
});

describe('Layout toc rail collapse', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults open, collapses on toggle, and persists the choice under aion2.toc', () => {
    renderLayout({ withToc: true });

    const rail = document.querySelector('.toc-rail')!;
    expect(rail.className).not.toContain('collapsed');
    expect(screen.getByText('1. Card one')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Hide table of contents'));
    expect(rail.className).toContain('collapsed');
    expect(screen.queryByText('1. Card one')).not.toBeInTheDocument();
    expect(localStorage.getItem('aion2.toc')).toBe('false');

    fireEvent.click(screen.getByLabelText('Show table of contents'));
    expect(rail.className).not.toContain('collapsed');
    expect(screen.getByText('1. Card one')).toBeInTheDocument();
    expect(localStorage.getItem('aion2.toc')).toBe('true');
  });

  it('restores a collapsed rail from storage on mount', () => {
    localStorage.setItem('aion2.toc', 'false');
    renderLayout({ withToc: true });

    const rail = document.querySelector('.toc-rail')!;
    expect(rail.className).toContain('collapsed');
  });
});
