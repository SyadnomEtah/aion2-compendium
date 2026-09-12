// Fetches generated content from public/content/. Cached per language and page for the session.

import type { Lang, PageData, SearchEntry, Task } from '../content-types';

const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/') + 'content/';
const cache = new Map<string, Promise<unknown>>();

function getJson<T>(path: string): Promise<T> {
  let p = cache.get(path) as Promise<T> | undefined;
  if (!p) {
    p = fetch(BASE + path).then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + path);
      return r.json() as Promise<T>;
    });
    p.catch(() => cache.delete(path));
    cache.set(path, p);
  }
  return p;
}

export function fetchPage(lang: Lang, pageId: string): Promise<PageData> {
  return getJson<PageData>(`${lang}/${pageId}.json`);
}

export function fetchSearchIndex(lang: Lang): Promise<SearchEntry[]> {
  return getJson<SearchEntry[]>(`${lang}/search.json`);
}

export function fetchTasks(): Promise<Task[]> {
  return getJson<Task[]>('tasks.json');
}
