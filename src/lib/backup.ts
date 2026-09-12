// Backup export/import. Format is frozen (ARCHITECTURE.md "React conventions"): existing exported files
// must keep importing.

import type { Task } from '../content-types';
import { storeDel, storeSet } from './store';
import type { Counts, Hidden, TrackerUserSettings } from './tracker';

export type ProfileField = 'name' | 'class' | 'faction' | 'server' | 'level' | 'ilvl';
export type Profile = Partial<Record<ProfileField, string>>;

export interface BackupCharacter {
  id: string;
  name: string;
  cls: string;
  level: number;
}

export interface BackupTracker {
  chars: BackupCharacter[];
  custom: Task[];
  counts: Counts;
  hidden: Hidden;
  settings: TrackerUserSettings;
}

export interface BackupData {
  version: 2;
  exported: string;
  chk: Record<string, boolean>;
  profile: Profile;
  page: string;
  tracker: BackupTracker;
}

/** Same shape as `BackupData` but with `tracker` optional, for `parseBackup`'s return value:
 * a backup file that has no `tracker` field must not synthesise an empty one, since callers use
 * its absence to mean "leave the current tracker state alone" (see ARCHITECTURE.md, import handler). */
export type ParsedBackup = Omit<BackupData, 'tracker'> & { tracker: BackupTracker | undefined };

/** Builds the exact backup shape written to the downloaded file. */
export function buildBackup(
  chk: Record<string, boolean>,
  profile: Profile,
  page: string,
  tracker: BackupTracker,
): BackupData {
  return {
    version: 2,
    exported: new Date().toISOString(),
    chk,
    profile,
    page,
    tracker,
  };
}

/**
 * Parses and validates a backup file's text. Throws if the text is not JSON or `chk` is not an object
 * (the only structural check the original import handler made before trusting the file). Missing
 * fields fall back to empty defaults, same as that handler did.
 *
 * `tracker` is the one exception: when the field is absent from the file, `tracker` comes back
 * `undefined` rather than a synthesised empty tracker. A backup file that has no `tracker` field
 * predates the tracker feature, and importing it must not wipe the current tracker's characters,
 * custom tasks and counts. Callers must check for `undefined` and skip the tracker update in that
 * case, rather than applying it.
 */
export function parseBackup(text: string): ParsedBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Not a valid backup file');
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof (parsed as { chk?: unknown }).chk !== 'object' ||
    (parsed as { chk?: unknown }).chk === null
  ) {
    throw new Error('Not a valid backup file');
  }
  const d = parsed as Partial<BackupData>;
  const t = d.tracker;
  return {
    version: 2,
    exported: d.exported ?? new Date().toISOString(),
    chk: (d.chk as Record<string, boolean>) ?? {},
    profile: d.profile ?? {},
    page: d.page ?? 'home',
    tracker: t
      ? {
          chars: t.chars ?? [],
          custom: t.custom ?? [],
          counts: t.counts ?? {},
          hidden: t.hidden ?? {},
          settings:
            t.settings ?? ({ daily: '09:00', wday: 3, showAll: false, showHidden: false, showDetails: false } as TrackerUserSettings),
        }
      : undefined,
  };
}

/** Triggers a browser download of `data` as pretty-printed JSON named `name`. */
export function downloadJson(name: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}

export function backupFileName(now: Date = new Date()): string {
  return 'aion2-progress-' + now.toISOString().slice(0, 10) + '.json';
}

/**
 * Shared export action for RoadmapPage and BackupBanner: builds the backup, downloads it, records the
 * export time and clears any snooze. Callers still show their own toast (needs `T()` from useLang).
 */
export function exportBackup(
  chk: Record<string, boolean>,
  profile: Profile,
  page: string,
  tracker: BackupTracker,
): BackupData {
  const data = buildBackup(chk, profile, page, tracker);
  downloadJson(backupFileName(), data);
  storeSet('lastExport', Date.now());
  storeDel('bkSnooze');
  return data;
}
