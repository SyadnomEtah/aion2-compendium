// Static app data: classes, guide sections and their icons.
// Icons are inline SVG strings rendered through dangerouslySetInnerHTML (see components/Icon.tsx).

export type Role = 'tank' | 'dps' | 'healer' | 'support';

export interface ClassInfo {
  id: string;
  name: string;
  role: Role;
  /** English role label, translated with T() */
  roleName: string;
  /** English blurb, translated with T() */
  blurb: string;
}

export const ICON: Record<string, string> = {
  templar: '<svg viewBox="0 0 24 24"><path d="M12 2l8 3.5v6c0 5-3.4 9.2-8 10.5C7.4 20.7 4 16.5 4 11.5v-6z"/><path d="M12 7v9M8.5 11h7"/></svg>',
  gladiator: '<svg viewBox="0 0 24 24"><path d="M14.5 3.5l6 6L9 21l-6-6z"/><path d="M14.5 3.5L21 3l-.5 6.5"/><path d="M6 15l3 3"/><path d="M3 21l3-3"/></svg>',
  assassin: '<svg viewBox="0 0 24 24"><path d="M4 3l7 9-2 2L3 8z"/><path d="M20 3l-7 9 2 2 6-6z"/><path d="M9 14l-5 7M15 14l5 7"/></svg>',
  ranger: '<svg viewBox="0 0 24 24"><path d="M6 3c7 3.5 7 14.5 0 18"/><path d="M6 3l1 18"/><path d="M4 12h16"/><path d="M17 9l3 3-3 3"/></svg>',
  sorcerer: '<svg viewBox="0 0 24 24"><path d="M12 3c.5 3.5 5 5 5 9.5A5 5 0 0 1 7 12.5c0-2.5 1.5-3.5 2-5.5 1 1 1.5 2 2.5 2.5C11 7 11 5 12 3z"/><path d="M12 21v-4"/></svg>',
  spiritmaster: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
  cleric: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 6v12M6 12h12"/></svg>',
  chanter: '<svg viewBox="0 0 24 24"><path d="M12 22V9"/><circle cx="12" cy="5.5" r="3"/><path d="M8 22h8"/><path d="M6 14c2-1 4-1 6 0s4 1 6 0"/></svg>',
  // generic
  home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>',
  start: '<svg viewBox="0 0 24 24"><path d="M5 3l14 9-14 9z"/></svg>',
  priorities: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h10M4 18h6"/></svg>',
  avoid: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M5.5 5.5l13 13"/></svg>',
  systems: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  systemsTile: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
  dungeons: '<svg viewBox="0 0 24 24"><path d="M3 21V10l9-7 9 7v11"/><path d="M9 21v-6h6v6"/></svg>',
  money: '<svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></svg>',
  moneyTile: '<svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>',
  classes: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  roadmap: '<svg viewBox="0 0 24 24"><path d="M4 19V5M4 12h12l-2-3M16 12l-2 3M4 19h16"/></svg>',
  checklist: '<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  sources: '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  person: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
};

export const CLASSES: ClassInfo[] = [
  { id: 'templar', name: 'Templar', role: 'tank', roleName: 'Tank', blurb: 'Sword and shield main tank. Beginner friendly, gear dependent, lowest melee DPS.' },
  { id: 'gladiator', name: 'Gladiator', role: 'dps', roleName: 'Melee DPS', blurb: 'Greatsword or polearm bruiser. Simplest class to learn, forgiving solo leveling.' },
  { id: 'assassin', name: 'Assassin', role: 'dps', roleName: 'Melee DPS', blurb: 'Dagger burst and stealth. Hard to master, top-tier PvP, contested PvE ranking.' },
  { id: 'ranger', name: 'Ranger', role: 'dps', roleName: 'Ranged DPS', blurb: 'Bow kiting and traps. Easy to medium, strong sustained PvE, safe first pick.' },
  { id: 'sorcerer', name: 'Sorcerer', role: 'dps', roleName: 'Magic DPS', blurb: 'Fire and ice glass cannon. Freeze then burst. Rated hardest by one source.' },
  { id: 'spiritmaster', name: 'Spiritmaster', role: 'dps', roleName: 'Magic DPS', blurb: 'Four elemental spirits, DoTs and fear. Friendlier than Sorcerer, tier contested.' },
  { id: 'cleric', name: 'Cleric', role: 'healer', roleName: 'Healer', blurb: 'Mace or staff healer. Near mandatory in dungeons, solid solo, meta shifted in KR.' },
  { id: 'chanter', name: 'Chanter', role: 'support', roleName: 'Support', blurb: 'Staff hybrid buffer with mantras. Shines in premades, average solo queue.' },
];

export const CLASS_NAME: Record<string, string> = Object.fromEntries(CLASSES.map((c) => [c.id, c.name]));

export interface SectionInfo {
  id: string;
  /** English name as originally written */
  name: string;
  blurb: string;
  icon: string;
}

/** Home page section tiles, in display order */
export const SECTIONS: SectionInfo[] = [
  { id: 'start', name: 'Start Here', blurb: 'What AION 2 is, launch schedule, faction and server, F2P asterisk, first 3 hours.', icon: ICON.start },
  { id: 'priorities', name: 'Priorities', blurb: 'Level timeline, first day, first week, when to stop rushing and fix power walls.', icon: ICON.priorities },
  { id: 'systems', name: 'Systems', blurb: 'Every progression system explained: Daevanion, Stigma, Arcana, gear, Pantheon, currencies.', icon: ICON.systemsTile },
  { id: 'dungeons', name: 'Dungeons & Energy', blurb: 'Odyle Energy, full dungeon table, where to spend energy at each level band.', icon: ICON.dungeons },
  { id: 'money', name: 'Premium & Spending', blurb: 'Founder packs, Membership, Daeva Pass, cash shop, what is worth it and what is a trap.', icon: ICON.moneyTile },
  { id: 'avoid', name: 'What to avoid', blurb: 'Beginner mistakes from community write-ups, grouped by theme.', icon: ICON.avoid },
  { id: 'roadmap', name: 'Progression roadmap', blurb: 'Seven phases from pre-launch to first weeks at cap. Tick milestones, progress is saved.', icon: ICON.roadmap },
  { id: 'checklist', name: 'Daily / Weekly', blurb: 'Reset checklists for dailies, weeklies and instanced content.', icon: ICON.checklist },
  { id: 'sources', name: 'Sources & Glossary', blurb: 'How to read badges, trust tiers, master source list, known unknowns, glossary.', icon: ICON.sources },
];

export const LAUNCH = {
  advanceAccess: new Date('2026-09-30T00:00:00Z'),
  global: new Date('2026-10-05T00:00:00Z'),
};
