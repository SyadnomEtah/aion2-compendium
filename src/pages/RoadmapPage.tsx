// Progression roadmap page: checklist/roadmap persistence, profile, export/import/reset.

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type MouseEvent } from 'react';
import { useLocation } from 'react-router-dom';
import type { HtmlBlock, PageData, PhaseBlock } from '../content-types';
import { useToast } from '../components/Toast';
import { fetchPage } from '../lib/content';
import { CLASSES } from '../lib/data';
import { useLang } from '../lib/i18n';
import { useRegisterPageHandlers } from '../lib/pageActions';
import { phaseStats, useChk, useProfile } from '../lib/progress';
import { exportBackup, parseBackup, type Profile, type ProfileField } from '../lib/backup';
import { useTracker } from '../lib/tracker';

const PROFILE_FIELDS: ProfileField[] = ['name', 'class', 'faction', 'server', 'level', 'ilvl'];

function currentPageId(pathname: string): string {
  const id = pathname.replace(/^\/+/, '');
  return id || 'home';
}

export function RoadmapPage() {
  const { T, lang } = useLang();
  const toast = useToast();
  const location = useLocation();
  const [chk, setTick, resetChk] = useChk();
  const [profile, setProfileField] = useProfile();
  const tracker = useTracker();
  const [page, setPage] = useState<PageData | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPage(lang, 'roadmap').then((d) => {
      if (!cancelled) setPage(d);
    });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const phases = useMemo(() => page?.blocks.filter((b): b is PhaseBlock => b.type === 'phase') ?? [], [page]);
  const introBlocks = useMemo(() => page?.blocks.filter((b): b is HtmlBlock => b.type === 'html') ?? [], [page]);

  let firstIncompleteId: string | null = null;
  let overallDone = 0;
  let overallTotal = 0;
  const statsById = new Map<string, ReturnType<typeof phaseStats>>();
  for (const ph of phases) {
    const s = phaseStats(ph, chk);
    statsById.set(ph.id, s);
    overallDone += s.done;
    overallTotal += s.total;
    if (firstIncompleteId === null && s.done < s.total) firstIncompleteId = ph.id;
  }
  const overallPct = overallTotal ? Math.round((overallDone / overallTotal) * 100) : 0;

  const pageHandlers = useMemo(
    () => ({
      expandAll: () => setCollapsed({}),
      collapseAll: () => setCollapsed(Object.fromEntries(phases.map((p) => [p.id, true]))),
    }),
    [phases],
  );
  useRegisterPageHandlers(pageHandlers);

  function togglePhase(id: string) {
    setCollapsed((c) => ({ ...c, [id]: !c[id] }));
  }

  function handleHeaderClick(id: string, e: MouseEvent<HTMLElement>) {
    if ((e.target as HTMLElement).closest('a,input,label')) return;
    togglePhase(id);
  }

  function handleExport() {
    exportBackup(chk, profile, currentPageId(location.pathname), tracker.get());
    toast(T('Backup downloaded'));
  }

  function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = parseBackup(String(reader.result));
        resetChk(() => true);
        for (const [key, value] of Object.entries(data.chk)) {
          if (value) setTick(key, true);
        }
        for (const field of PROFILE_FIELDS) {
          setProfileField(field, (data.profile as Profile)[field] ?? '');
        }
        if (data.tracker) {
          tracker.set(data.tracker);
        }
        toast(T('Backup imported'));
      } catch {
        toast(T('Not a valid backup file'));
      }
    };
    reader.readAsText(file);
  }

  function handleResetRoadmap() {
    if (window.confirm(T('Untick every roadmap milestone? Profile is kept.'))) {
      resetChk((k) => k.startsWith('r-'));
      toast(T('Roadmap reset'));
    }
  }

  return (
    <>
      <div className="backrow">
        <span className="meta">
          {T('Tick milestones as you hit them. Saved in this browser (localStorage). Export a backup before clearing browser data.')}
        </span>
        <span className="classnav">
          <button onClick={handleExport}>{T('Export backup')}</button>
          <label className="filebtn">
            <button type="button" onClick={() => fileInputRef.current?.click()}>
              {T('Import backup')}
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportFile} />
          </label>
          <button onClick={handleResetRoadmap}>{T('Reset roadmap')}</button>
        </span>
      </div>
      <div className="profile profile-card">
        <div className="profile-card-title">
          <h3>{T('Your character')}</h3>
          <p className="meta">{T('Used to personalize the roadmap and tracker. Kept only in this browser.')}</p>
        </div>
        <label>
          {T('Character name')}
          <input
            value={profile.name ?? ''}
            placeholder={T('optional')}
            onChange={(e) => setProfileField('name', e.target.value)}
          />
        </label>
        <label>
          {T('Class')}
          <select value={profile.class ?? ''} onChange={(e) => setProfileField('class', e.target.value)}>
            <option value="">{T('not chosen')}</option>
            {CLASSES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {T('Faction')}
          <select value={profile.faction ?? ''} onChange={(e) => setProfileField('faction', e.target.value)}>
            <option value="">{T('not chosen')}</option>
            <option value="Elyos">Elyos</option>
            <option value="Asmodian">Asmodian</option>
          </select>
        </label>
        <label>
          {T('Server')}
          <input
            value={profile.server ?? ''}
            placeholder={T('server name')}
            onChange={(e) => setProfileField('server', e.target.value)}
          />
        </label>
        <label>
          {T('Current level')}
          <input
            type="number"
            min={1}
            max={99}
            value={profile.level ?? ''}
            placeholder="1"
            onChange={(e) => setProfileField('level', e.target.value)}
          />
        </label>
        <label>
          {T('Item level / combat power')}
          <input
            value={profile.ilvl ?? ''}
            placeholder={T('optional')}
            onChange={(e) => setProfileField('ilvl', e.target.value)}
          />
        </label>
      </div>
      <div className="overall">
        <div className="progress">
          <i style={{ width: overallPct + '%' }} />
        </div>
        <b>{overallPct}%</b>
      </div>
      <div id="roadmap-body">
        {introBlocks.map((b, i) => (
          <div key={i} dangerouslySetInnerHTML={{ __html: b.html }} />
        ))}
        {phases.map((ph) => {
          const s = statsById.get(ph.id) ?? { done: 0, total: 0, pct: 0 };
          const isDone = s.total > 0 && s.done === s.total;
          const isCurrent = ph.id === firstIncompleteId;
          const isCollapsed = !!collapsed[ph.id];
          const classes = ['phase', isDone && 'done', isCurrent && 'current', isCollapsed && 'collapsed']
            .filter(Boolean)
            .join(' ');
          return (
            <section className={classes} key={ph.id} data-phase={ph.id}>
              <header
                className="phase-h"
                role="button"
                tabIndex={0}
                aria-expanded={!isCollapsed}
                aria-controls={'phase-b-' + ph.id}
                onClick={(e) => handleHeaderClick(ph.id, e)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    togglePhase(ph.id);
                  }
                }}
              >
                <span className="phase-num-ring" style={{ '--p': s.pct } as CSSProperties}>
                  <span className="phase-num">{ph.num}</span>
                </span>
                <div>
                  <h3>{ph.title}</h3>
                  <p className="phase-goal" dangerouslySetInnerHTML={{ __html: ph.goalHtml }} />
                </div>
                <div className="progress">
                  <i style={{ width: s.pct + '%' }} />
                </div>
                <span className="pct">
                  {s.done}/{s.total} · {s.pct}%
                </span>
              </header>
              <div className="phase-b" id={'phase-b-' + ph.id}>
                <ul className="chk">
                  {ph.milestones.map((m) => (
                    <li key={m.key} className={chk[m.key] ? 'done' : ''}>
                      <label>
                        <input
                          type="checkbox"
                          checked={!!chk[m.key]}
                          onChange={(e) => setTick(m.key, e.target.checked)}
                        />
                        <span dangerouslySetInnerHTML={{ __html: m.labelHtml }} />
                      </label>
                      {m.whyHtml && <p className="why" dangerouslySetInnerHTML={{ __html: m.whyHtml }} />}
                    </li>
                  ))}
                </ul>
                {ph.extraHtml && <div dangerouslySetInnerHTML={{ __html: ph.extraHtml }} />}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
