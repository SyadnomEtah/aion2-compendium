import { useState, type ReactNode } from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useLang } from '../lib/i18n';
import { useToc } from '../lib/tocActions';
import { storeGet, storeSet } from '../lib/store';
import { BackupBanner } from './BackupBanner';
import { Sidebar } from './Sidebar';
import { Toc } from './Toc';
import { TopBar } from './TopBar';

export function Layout({ children }: { children: ReactNode }) {
  const { T } = useLang();
  const [sideOpen, setSideOpen] = useState(false);
  const { toc } = useToc();
  const [tocOpen, setTocOpen] = useState<boolean>(() => storeGet('toc', true));

  function closeSide() {
    setSideOpen(false);
  }

  function toggleToc() {
    setTocOpen((prev) => {
      const next = !prev;
      storeSet('toc', next);
      return next;
    });
  }

  return (
    <>
      <div className={sideOpen ? 'scrim open' : 'scrim'} onClick={closeSide} />
      <div className={toc ? 'app has-toc-rail' : 'app'}>
        <Sidebar open={sideOpen} onNavigate={closeSide} />
        <TopBar onBurgerClick={() => setSideOpen((v) => !v)} />
        <div className="content">
          <main>
            <BackupBanner />
            {children}
          </main>
          <footer>
            {T(
              'Compiled 2026-09-12 for personal use. Sources are linked inline; boosting and marketing sites are marked lower trust. Game data belongs to NCSoft. Re-verify anything marked KR-era after the 2026-10-05 global launch.',
            )}
          </footer>
        </div>
        {toc ? (
          <aside className={tocOpen ? 'toc-rail' : 'toc-rail collapsed'}>
            <button
              type="button"
              className="toc-toggle"
              onClick={toggleToc}
              title={tocOpen ? T('Hide table of contents') : T('Show table of contents')}
              aria-label={tocOpen ? T('Hide table of contents') : T('Show table of contents')}
              aria-expanded={tocOpen}
            >
              {tocOpen ? <PanelRightClose /> : <PanelRightOpen />}
            </button>
            {tocOpen ? <Toc cards={toc.cards} onNavigate={toc.onNavigate} /> : null}
          </aside>
        ) : null}
      </div>
    </>
  );
}
