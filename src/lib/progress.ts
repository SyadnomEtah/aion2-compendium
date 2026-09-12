// Roadmap progress state: checklist ticks and roadmap phase persistence.
//
// `chk` and `profile` live at module scope behind listener sets, the same pattern as lib/tracker.ts: several
// components (RoadmapPage, RoadmapSummary on Home, BackupBanner) read the same ticked-milestone and profile
// state and must all re-render when any one of them changes it, without polling.

import { useEffect, useState } from 'react';
import type { PageData, PhaseBlock } from '../content-types';
import type { Profile } from './backup';
import { fetchPage } from './content';
import { useLang } from './i18n';
import { storeGet, storeSet } from './store';

export type Chk = Record<string, boolean>;

let chk: Chk = storeGet<Chk>('chk', {});
const chkListeners = new Set<() => void>();
function notifyChk(): void {
  chkListeners.forEach((l) => l());
}

/**
 * Shared roadmap-milestone state.
 * `setTick(key, value)` ticks or unticks one milestone; `reset(predicate)` unticks every key matching
 * `predicate` (e.g. `k => k.startsWith('r-')` for "Reset roadmap", or `() => true` to replace on import).
 */
export function useChk(): [Chk, (key: string, value: boolean) => void, (predicate: (key: string) => boolean) => void] {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const listener = () => forceRender((n) => n + 1);
    chkListeners.add(listener);
    return () => {
      chkListeners.delete(listener);
    };
  }, []);

  const setTick = (key: string, value: boolean) => {
    chk = { ...chk, [key]: value };
    storeSet('chk', chk);
    notifyChk();
  };

  const reset = (predicate: (key: string) => boolean) => {
    const next = { ...chk };
    for (const key of Object.keys(next)) {
      if (predicate(key)) delete next[key];
    }
    chk = next;
    storeSet('chk', chk);
    notifyChk();
  };

  return [chk, setTick, reset];
}

let profile: Profile = storeGet<Profile>('profile', {});
const profileListeners = new Set<() => void>();
function notifyProfile(): void {
  profileListeners.forEach((l) => l());
}

/** Shared profile-form state (character name, class, faction, server, level, item level). */
export function useProfile(): [Profile, (field: keyof Profile, value: string) => void] {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const listener = () => forceRender((n) => n + 1);
    profileListeners.add(listener);
    return () => {
      profileListeners.delete(listener);
    };
  }, []);

  const setField = (field: keyof Profile, value: string) => {
    profile = { ...profile, [field]: value };
    storeSet('profile', profile);
    notifyProfile();
  };

  return [profile, setField];
}

export function hasAnyProfileValue(p: Profile): boolean {
  return Object.values(p).some((v) => !!v && String(v).trim() !== '');
}

export interface PhaseStats {
  done: number;
  total: number;
  pct: number;
}

/** Ticked/total milestone count for one phase, and the rounded percent (0 when the phase has no milestones). */
export function phaseStats(phase: PhaseBlock, chkState: Chk): PhaseStats {
  const total = phase.milestones.length;
  const done = phase.milestones.filter((m) => chkState[m.key]).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { done, total, pct };
}

export interface PhaseProgress {
  id: string;
  title: string;
  done: number;
  total: number;
  pct: number;
}

export interface RoadmapProgress {
  overallPct: number;
  done: number;
  total: number;
  phases: PhaseProgress[];
}

// The roadmap PageData rarely changes at runtime, so cache it per language for the session (fetchPage
// already caches the network request; this also caches the derived PhaseBlock extraction).
const pageCache = new Map<string, PageData>();
const pagePromises = new Map<string, Promise<PageData>>();

function loadRoadmapPage(lang: string, onLoaded: (data: PageData) => void): void {
  const cached = pageCache.get(lang);
  if (cached) {
    onLoaded(cached);
    return;
  }
  let p = pagePromises.get(lang);
  if (!p) {
    p = fetchPage(lang as 'en' | 'pl', 'roadmap');
    pagePromises.set(lang, p);
  }
  p.then((data) => {
    pageCache.set(lang, data);
    onLoaded(data);
  }).catch(() => {
    // leave the cache empty; the caller keeps showing zeroes until a retry (e.g. a language switch) succeeds
  });
}

/** Fetches the roadmap page once per language and derives per-phase and overall milestone progress from `chk`. */
export function useRoadmapProgress(): RoadmapProgress {
  const { lang } = useLang();
  const [chkState] = useChk();
  const [page, setPage] = useState<PageData | null>(() => pageCache.get(lang) ?? null);

  useEffect(() => {
    let cancelled = false;
    loadRoadmapPage(lang, (data) => {
      if (!cancelled) setPage(data);
    });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  if (!page) return { overallPct: 0, done: 0, total: 0, phases: [] };

  const phaseBlocks = page.blocks.filter((b): b is PhaseBlock => b.type === 'phase');
  let done = 0;
  let total = 0;
  const phases: PhaseProgress[] = phaseBlocks.map((ph) => {
    const s = phaseStats(ph, chkState);
    done += s.done;
    total += s.total;
    return { id: ph.id, title: ph.title, done: s.done, total: s.total, pct: s.pct };
  });
  const overallPct = total ? Math.round((done / total) * 100) : 0;
  return { overallPct, done, total, phases };
}
