// Thin localStorage wrapper. Keys are prefixed "aion2." and match the previous site's keys so returning visitors keep their data.

const PREFIX = 'aion2.';

export type StoreKey =
  | 'lang' | 'page' | 'compact' | 'classCompact'
  | 'chk' | 'profile'
  | 'chars' | 'customTasks' | 'counts' | 'hiddenTasks' | 'trk' | 'trkReset'
  | 'lastExport' | 'bkSnooze'
  | 'theme' | 'nav' | 'toc' | 'collapsed';

export function storeGet<T>(key: StoreKey, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function storeSet(key: StoreKey, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // storage full or blocked: the app keeps working in memory
  }
}

export function storeDel(key: StoreKey): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}
