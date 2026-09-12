import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App, { normalizeLegacyHash } from './App';
import { LangProvider } from './lib/i18n';
import { PageActionsProvider } from './lib/pageActions';
import { TocProvider } from './lib/tocActions';
import { ToastProvider } from './components/Toast';
import { applyStoredTheme } from './lib/theme';
import './styles/tokens.css';
import './styles/base.css';
import './styles/shell.css';
import './styles/content.css';
import './styles/pages.css';

// Both must run before the first paint: normalizeLegacyHash before HashRouter reads
// window.location.hash, applyStoredTheme before tokens.css's default (system) theme paints.
normalizeLegacyHash();
applyStoredTheme();

// A bare `#pageid` link followed (or typed) while the app is already running only fires a
// hashchange event, it does not reload the page, so normalizeLegacyHash must also run here.
window.addEventListener('hashchange', normalizeLegacyHash);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
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
    </HashRouter>
  </StrictMode>,
);
