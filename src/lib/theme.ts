// Theme (light/dark) state. Applies a `data-theme` attribute on <html> that CSS tokens key off.
// When the user has never chosen a theme explicitly, no attribute is set and tokens.css falls back
// to `prefers-color-scheme` so the site follows the OS setting.

import { storeGet, storeSet } from './store';

export type ThemeChoice = 'light' | 'dark';

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** The explicitly stored choice, or null when the user has never toggled it. */
export function getStoredTheme(): ThemeChoice | null {
  return storeGet<ThemeChoice | null>('theme', null);
}

/** The theme actually in effect: the stored choice, or the OS preference otherwise. */
export function effectiveTheme(): ThemeChoice {
  return getStoredTheme() ?? (systemPrefersDark() ? 'dark' : 'light');
}

/** Applies the stored theme (if any) to <html>. Call once before the first paint. */
export function applyStoredTheme(): void {
  const stored = getStoredTheme();
  if (stored) document.documentElement.setAttribute('data-theme', stored);
}

/** Stores and applies an explicit theme choice. */
export function setTheme(theme: ThemeChoice): void {
  storeSet('theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
}
