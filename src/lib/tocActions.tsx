// Lets a guide page (via GuideBody) publish its "On this page" TOC data up to Layout, which
// renders the right-hand rail column (>=1280px) outside the page's own DOM subtree. Mirrors the
// register-on-mount pattern in pageActions.tsx.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CardBlock } from '../content-types';

export interface TocData {
  cards: CardBlock[];
  onNavigate: (id: string) => void;
}

interface TocCtx {
  toc: TocData | null;
  setToc: (toc: TocData | null) => void;
}

const Ctx = createContext<TocCtx | null>(null);

export function TocProvider({ children }: { children: ReactNode }) {
  const [toc, setToc] = useState<TocData | null>(null);
  const value = useMemo<TocCtx>(() => ({ toc, setToc }), [toc]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useToc(): TocCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToc outside TocProvider');
  return ctx;
}

/** Registers this page's TOC data while mounted; pass null to publish "no TOC" (e.g. hasToc is false). */
export function useRegisterToc(data: TocData | null): void {
  const { setToc } = useToc();
  useEffect(() => {
    setToc(data);
    return () => setToc(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
}
