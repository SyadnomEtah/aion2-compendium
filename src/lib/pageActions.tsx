// Lets the TopBar "Expand all" / "Collapse all" buttons reach whichever page is mounted.
// A page registers its handlers on mount and clears them on unmount.

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';

export interface PageHandlers {
  expandAll: () => void;
  collapseAll: () => void;
}

interface PageActionsCtx {
  /** call from a page: useEffect(() => setHandlers(h), [h]) */
  setHandlers: (h: PageHandlers | null) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

const Ctx = createContext<PageActionsCtx | null>(null);

export function PageActionsProvider({ children }: { children: ReactNode }) {
  const ref = useRef<PageHandlers | null>(null);
  const value = useMemo<PageActionsCtx>(() => ({
    setHandlers: (h) => { ref.current = h; },
    expandAll: () => ref.current?.expandAll(),
    collapseAll: () => ref.current?.collapseAll(),
  }), []);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePageActions(): PageActionsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePageActions outside PageActionsProvider');
  return ctx;
}

/** convenience for pages: registers handlers while mounted */
export function useRegisterPageHandlers(handlers: PageHandlers) {
  const { setHandlers } = usePageActions();
  useEffect(() => {
    setHandlers(handlers);
    return () => setHandlers(null);
  }, [handlers, setHandlers]);
}
