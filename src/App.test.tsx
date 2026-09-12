import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App, { normalizeLegacyHash } from './App';
import type { PageData } from './content-types';
import { LangProvider } from './lib/i18n';
import { PageActionsProvider } from './lib/pageActions';
import { TocProvider } from './lib/tocActions';
import { ToastProvider } from './components/Toast';

const minimalPage: PageData = { id: 'home', title: 'Home', single: false, blocks: [] };

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(minimalPage),
      } as Response),
    ),
  );
});

function renderApp() {
  return render(
    <HashRouter>
      <LangProvider>
        <ToastProvider>
          <PageActionsProvider>
            <TocProvider>
              <App />
            </TocProvider>
          </PageActionsProvider>
        </ToastProvider>
      </LangProvider>
    </HashRouter>,
  );
}

describe('App', () => {
  it('renders the sidebar brand', () => {
    renderApp();
    expect(screen.getByText('AION 2 Compendium')).toBeInTheDocument();
  });
});

describe('normalizeLegacyHash', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('rewrites a bare #pageid hash to #/pageid without adding a history entry', () => {
    window.history.replaceState(null, '', '#classes');
    const lengthBefore = window.history.length;
    normalizeLegacyHash();
    expect(window.location.hash).toBe('#/classes');
    expect(window.history.length).toBe(lengthBefore);
  });

  it('leaves a hash that already has a leading slash alone', () => {
    window.history.replaceState(null, '', '#/roadmap');
    normalizeLegacyHash();
    expect(window.location.hash).toBe('#/roadmap');
  });

  it('does nothing when there is no hash', () => {
    window.history.replaceState(null, '', '/');
    normalizeLegacyHash();
    expect(window.location.hash).toBe('');
  });
});
