// Daily/weekly tracker state.
//
// State lives at module scope (like the chk store in lib/progress.ts) behind a listener set, so
// TrackerPage and BackupBanner both see the same characters/counts/settings without prop drilling or
// polling: any mutation notifies every mounted useTracker() consumer.

import { useEffect, useState } from 'react';
import type { Task } from '../content-types';
import { fetchTasks } from './content';
import { lastDaily, lastWeekly, type TrackerSettings } from './time';
import { storeGet, storeSet } from './store';

export interface Character {
  id: string;
  name: string;
  cls: string;
  level: number;
}

/** counts[taskId][charId | '_acct'] = completions since the last reset */
export type Counts = Record<string, Record<string, number>>;
/** hidden[taskId] = true when the row is hidden from the table */
export type Hidden = Record<string, boolean>;

export interface TrackerUserSettings extends TrackerSettings {
  showAll: boolean;
  showHidden: boolean;
  showDetails: boolean;
}

export interface TrackerData {
  chars: Character[];
  custom: Task[];
  counts: Counts;
  hidden: Hidden;
  settings: TrackerUserSettings;
}

export interface NewCustomTask {
  name: string;
  scope: 'daily' | 'weekly';
  per: 'character' | 'account';
  max: number | null;
  minLevel: number | null;
}

const DEFAULT_SETTINGS: TrackerUserSettings = {
  daily: '09:00',
  wday: 3,
  showAll: false,
  showHidden: false,
  showDetails: false,
};

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

let baseTasks: Task[] = [];
let baseTasksRequested = false;

let chars: Character[] = storeGet<Character[]>('chars', []);
let custom: Task[] = storeGet<Task[]>('customTasks', []);
let counts: Counts = storeGet<Counts>('counts', {});
let hidden: Hidden = storeGet<Hidden>('hiddenTasks', {});
let settings: TrackerUserSettings = { ...DEFAULT_SETTINGS, ...storeGet<Partial<TrackerUserSettings>>('trk', {}) };
let resetTs: { d: number; w: number } = storeGet('trkReset', { d: 0, w: 0 });

const listeners = new Set<() => void>();
function notify(): void {
  listeners.forEach((l) => l());
}

function allTasksOf(customTasks: Task[]): Task[] {
  return baseTasks.concat(customTasks);
}

/** Deletes every counter for `scope` (used by manual and automatic resets). */
function wipe(scope: 'daily' | 'weekly'): void {
  const next: Counts = { ...counts };
  allTasksOf(custom).forEach((t) => {
    if (t.scope === scope) delete next[t.id];
  });
  counts = next;
  storeSet('counts', counts);
}

/** Records the current reset boundaries without wiping anything (used the first time, and after a settings change). */
export function rebase(now: Date = new Date()): void {
  resetTs = { d: lastDaily(now, settings).getTime(), w: lastWeekly(now, settings).getTime() };
  storeSet('trkReset', resetTs);
}

/** Wipes counters whose stored boundary predates the current one. Returns whether anything was wiped. */
export function autoReset(now: Date = new Date()): boolean {
  const ld = lastDaily(now, settings).getTime();
  const lw = lastWeekly(now, settings).getTime();
  let changed = false;
  if (resetTs.d && resetTs.d < ld) {
    wipe('daily');
    changed = true;
  }
  if (resetTs.w && resetTs.w < lw) {
    wipe('weekly');
    changed = true;
  }
  resetTs = { d: ld, w: lw };
  storeSet('trkReset', resetTs);
  if (changed) notify();
  return changed;
}

function ensureBaseTasksLoaded(): void {
  if (baseTasksRequested) return;
  baseTasksRequested = true;
  fetchTasks()
    .then((tasks) => {
      baseTasks = tasks;
      notify();
    })
    .catch(() => {
      baseTasks = [];
      notify();
    });
}

function addCharacter(name: string, cls: string, level: number): void {
  chars = [...chars, { id: uid(), name, cls, level: level || 1 }];
  storeSet('chars', chars);
  notify();
}

function removeCharacter(id: string): void {
  chars = chars.filter((c) => c.id !== id);
  storeSet('chars', chars);
  notify();
}

function setCharacterLevel(id: string, level: number): void {
  chars = chars.map((c) => (c.id === id ? { ...c, level } : c));
  storeSet('chars', chars);
  notify();
}

function addCustomTask(input: NewCustomTask): void {
  const task: Task = {
    id: 'c-' + uid(),
    name: input.name,
    scope: input.scope,
    per: input.per,
    max: input.max,
    unit: '',
    minLevel: input.minLevel,
    group: 'Custom',
    note: 'Custom task',
    src: '',
    srcLabel: '',
    confidence: '',
    krEra: false,
    custom: true,
  };
  custom = [...custom, task];
  storeSet('customTasks', custom);
  notify();
}

/** Bumps a task's counter for one character (or the account, for per-account tasks), clamped to [0, max]. */
function bump(task: Task, charId: string, delta: number): void {
  const key = task.per === 'account' ? '_acct' : charId;
  const bucket = { ...(counts[task.id] || {}) };
  let v = (bucket[key] || 0) + delta;
  if (v < 0) v = 0;
  if (task.max && v > task.max) v = task.max;
  bucket[key] = v;
  counts = { ...counts, [task.id]: bucket };
  storeSet('counts', counts);
  notify();
}

function toggleHidden(taskId: string): void {
  hidden = { ...hidden, [taskId]: !hidden[taskId] };
  storeSet('hiddenTasks', hidden);
  notify();
}

function setDaily(daily: string): void {
  settings = { ...settings, daily: daily || '09:00' };
  rebase();
  storeSet('trk', settings);
  notify();
}

function setWday(wday: number): void {
  settings = { ...settings, wday };
  rebase();
  storeSet('trk', settings);
  notify();
}

function setShowAll(v: boolean): void {
  settings = { ...settings, showAll: v };
  storeSet('trk', settings);
  notify();
}

function setShowHidden(v: boolean): void {
  settings = { ...settings, showHidden: v };
  storeSet('trk', settings);
  notify();
}

function setShowDetails(v: boolean): void {
  settings = { ...settings, showDetails: v };
  storeSet('trk', settings);
  notify();
}

function get(): TrackerData {
  return { chars, custom, counts, hidden, settings };
}

function set(data: Partial<TrackerData>): void {
  chars = data.chars ?? [];
  custom = data.custom ?? [];
  counts = data.counts ?? {};
  hidden = data.hidden ?? {};
  settings = { ...settings, ...(data.settings ?? {}) };
  storeSet('chars', chars);
  storeSet('customTasks', custom);
  storeSet('counts', counts);
  storeSet('hiddenTasks', hidden);
  storeSet('trk', settings);
  notify();
}

function wipeScope(scope: 'daily' | 'weekly'): void {
  wipe(scope);
  notify();
}

export interface UseTrackerResult {
  chars: Character[];
  custom: Task[];
  counts: Counts;
  hidden: Hidden;
  settings: TrackerUserSettings;
  /** the base task list from content/tasks.json, once loaded */
  tasks: Task[];
  /** base tasks plus custom tasks, in that order */
  allTasks: Task[];
  addCharacter: (name: string, cls: string, level: number) => void;
  removeCharacter: (id: string) => void;
  setCharacterLevel: (id: string, level: number) => void;
  addCustomTask: (input: NewCustomTask) => void;
  bump: (task: Task, charId: string, delta: number) => void;
  toggleHidden: (taskId: string) => void;
  wipe: (scope: 'daily' | 'weekly') => void;
  setDaily: (daily: string) => void;
  setWday: (wday: number) => void;
  setShowAll: (v: boolean) => void;
  setShowHidden: (v: boolean) => void;
  setShowDetails: (v: boolean) => void;
  get: () => TrackerData;
  set: (data: Partial<TrackerData>) => void;
}

export function useTracker(): UseTrackerResult {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const listener = () => forceRender((n) => n + 1);
    listeners.add(listener);
    ensureBaseTasksLoaded();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!storeGet('trkReset', null)) rebase();
    autoReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    chars,
    custom,
    counts,
    hidden,
    settings,
    tasks: baseTasks,
    allTasks: allTasksOf(custom),
    addCharacter,
    removeCharacter,
    setCharacterLevel,
    addCustomTask,
    bump,
    toggleHidden,
    wipe: wipeScope,
    setDaily,
    setWday,
    setShowAll,
    setShowHidden,
    setShowDetails,
    get,
    set,
  };
}
