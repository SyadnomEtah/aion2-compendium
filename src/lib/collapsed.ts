// Remembered open/closed state of guide cards and roadmap phases, keyed by element id
// (card ids are unique across pages, phase ids are prefixed with "roadmap-").
// Only ids the visitor has toggled or bulk-changed are stored; everything else uses its default.

import { useCallback, useEffect, useState } from 'react';
import { storeGet, storeSet } from './store';

export type CollapsedMap = Record<string, boolean>;

export function readCollapsed(): CollapsedMap {
  const raw = storeGet<unknown>('collapsed', {});
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as CollapsedMap) : {};
}

/** State hook backed by localStorage; `isCollapsed(id, fallback)` applies the per-element default. */
export function useCollapsed() {
  const [map, setMap] = useState<CollapsedMap>(readCollapsed);

  useEffect(() => {
    storeSet('collapsed', map);
  }, [map]);

  const isCollapsed = useCallback((id: string, fallback = false) => map[id] ?? fallback, [map]);
  const toggle = useCallback(
    (id: string, fallback = false) => setMap((m) => ({ ...m, [id]: !(m[id] ?? fallback) })),
    [],
  );
  const setMany = useCallback(
    (ids: string[], value: boolean) =>
      setMap((m) => {
        const next = { ...m };
        ids.forEach((id) => {
          next[id] = value;
        });
        return next;
      }),
    [],
  );
  const expand = useCallback((id: string) => setMap((m) => (m[id] === false ? m : { ...m, [id]: false })), []);

  return { map, isCollapsed, toggle, setMany, expand };
}
