// Contract between scripts/build_content.py and the React app.
// Keep in sync with ARCHITECTURE.md ("Content JSON").

export type Lang = 'en' | 'pl';

export interface HtmlBlock {
  type: 'html';
  html: string;
}

export interface ClassHeadBlock {
  type: 'classHead';
  role: string;
  html: string;
}

export interface CompareRow {
  name: string;
  classId?: string;
  cellsHtml: string[];
}

export interface CompareTable {
  heads: string[];
  headsEn: string[];
  rows: CompareRow[];
}

export interface CardBlock {
  type: 'card';
  id: string;
  title: string;
  titleEn: string;
  /** header children after the h3 (meta spans, badges) as HTML */
  headExtrasHtml: string;
  bodyHtml: string;
  /** body after the compare table, only when `compare` is set */
  bodyAfterHtml?: string;
  compare?: CompareTable;
  /** space separated lowercase keywords from data-tags */
  tags: string;
  level?: number;
}

export interface SourcesBlock {
  type: 'sourcesCard';
  title: string;
  bodyHtml: string;
  linkCount: number;
}

export interface Milestone {
  key: string;
  labelHtml: string;
  whyHtml: string;
}

export interface PhaseBlock {
  type: 'phase';
  id: string;
  num: string;
  title: string;
  goalHtml: string;
  milestones: Milestone[];
  extraHtml: string;
}

export type Block = HtmlBlock | ClassHeadBlock | CardBlock | SourcesBlock | PhaseBlock;

export interface PageData {
  id: string;
  title: string;
  classId?: string;
  /** exactly one content card: cards render without a number */
  single: boolean;
  blocks: Block[];
}

export interface SearchEntry {
  page: string;
  pageTitle: string;
  cardId: string;
  title: string;
  /** lowercased plain text of title, body and tags */
  text: string;
}

export interface Meta {
  cards: number;
  sourceLinks: number;
  pageCounts: Record<string, number>;
  compiled: string;
}

export interface Task {
  id: string;
  name: string;
  scope: 'daily' | 'weekly';
  per: 'character' | 'account';
  max: number | null;
  unit: string;
  minLevel: number | null;
  group: string;
  note: string;
  src: string;
  srcLabel: string;
  confidence: '' | 'confirmed' | 'single' | 'contested';
  krEra: boolean;
  custom?: boolean;
}

export const PAGE_IDS = [
  'home', 'start', 'priorities', 'systems', 'dungeons', 'money', 'avoid', 'classes',
  'class-templar', 'class-gladiator', 'class-assassin', 'class-ranger',
  'class-sorcerer', 'class-spiritmaster', 'class-cleric', 'class-chanter',
  'roadmap', 'checklist', 'sources',
] as const;
export type PageId = (typeof PAGE_IDS)[number];

/** English page titles, matching the page titles used on the original site */
export const PAGE_TITLES: Record<PageId, string> = {
  home: 'Home',
  start: 'Start Here',
  priorities: 'Priorities',
  systems: 'Systems',
  dungeons: 'Dungeons and Energy',
  money: 'Premium and Spending',
  avoid: 'What to avoid',
  classes: 'Classes',
  'class-templar': 'Templar',
  'class-gladiator': 'Gladiator',
  'class-assassin': 'Assassin',
  'class-ranger': 'Ranger',
  'class-sorcerer': 'Sorcerer',
  'class-spiritmaster': 'Spiritmaster',
  'class-cleric': 'Cleric',
  'class-chanter': 'Chanter',
  roadmap: 'Progression roadmap',
  checklist: 'Daily and Weekly tracker',
  sources: 'Sources and Glossary',
};
