import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HashRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TopBar } from './TopBar';
import type { SearchEntry } from '../content-types';
import { LangProvider } from '../lib/i18n';
import { PageActionsProvider } from '../lib/pageActions';

const SEARCH_INDEX: SearchEntry[] = [
  {
    page: 'roadmap',
    pageTitle: 'Progression roadmap',
    cardId: 'roadmap-p0',
    title: 'Phase 0',
    text: 'phase 0 founder access checklist',
  },
];

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(url.includes('search.json') ? SEARCH_INDEX : []),
      } as Response),
    ),
  );
});

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderTopBar() {
  return render(
    <HashRouter>
      <LangProvider>
        <PageActionsProvider>
          <TopBar onBurgerClick={() => {}} />
          <LocationProbe />
        </PageActionsProvider>
      </LangProvider>
    </HashRouter>,
  );
}

describe('SearchDialog (via TopBar)', () => {
  it('opens on trigger click and closes on Escape', () => {
    renderTopBar();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /search everything/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('dialog').querySelector('input')!, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens on Ctrl+K from anywhere on the page', () => {
    renderTopBar();

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('pressing Enter with no arrow-key selection navigates to the first hit (sel starts at 0)', async () => {
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: /search everything/i }));
    const input = screen.getByRole('dialog').querySelector('input')!;

    // Let the search index fetch resolve and the dialog re-render with it before typing,
    // otherwise the debounced search would run against the still-empty index.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    fireEvent.change(input, { target: { value: 'founder' } });

    await waitFor(() => expect(screen.getByText('Phase 0')).toBeInTheDocument(), { timeout: 2000 });

    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/roadmap'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('LanguagePicker (via TopBar)', () => {
  it('switches document.documentElement.lang to pl when Polski is chosen', () => {
    renderTopBar();

    expect(document.documentElement.lang).not.toBe('pl');
    fireEvent.click(screen.getByRole('button', { name: 'Language' }));
    fireEvent.click(screen.getByRole('option', { name: 'Polski' }));

    expect(document.documentElement.lang).toBe('pl');
  });
});
