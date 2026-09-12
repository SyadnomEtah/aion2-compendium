// Daily and weekly tracker page: owns chars/custom/counts/hidden/settings and renders them.

import { Fragment, useEffect, useRef, useState, type FormEvent } from 'react';
import type { Task } from '../content-types';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { CLASSES, CLASS_NAME } from '../lib/data';
import { useLang } from '../lib/i18n';
import { useProfile } from '../lib/progress';
import { fmtCountdown, nextDaily, nextWeekly } from '../lib/time';
import { autoReset, useTracker } from '../lib/tracker';

const WDAY_NAMES: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

function taskLimitText(t: Task, T: (s: string, vars?: Record<string, string | number>) => string): string {
  const acct = t.per === 'account' ? T('account') : '';
  const lvl = t.minLevel ? (t.per === 'account' ? ' · ' : '') + 'Lv ' + t.minLevel + '+' : '';
  return acct + lvl;
}

export function TrackerPage() {
  const { T, TH } = useLang();
  const toast = useToast();
  const [profile] = useProfile();
  const tracker = useTracker();

  const [now, setNow] = useState(() => new Date());
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());
  const [charFormOpen, setCharFormOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [armed, setArmed] = useState<string | null>(null);
  const armTimer = useRef<number | undefined>(undefined);

  const cfNameRef = useRef<HTMLInputElement>(null);
  const cfClassRef = useRef<HTMLSelectElement>(null);
  const cfLevelRef = useRef<HTMLInputElement>(null);
  const charFormRef = useRef<HTMLFormElement>(null);
  const tfNameRef = useRef<HTMLInputElement>(null);
  const tfScopeRef = useRef<HTMLSelectElement>(null);
  const tfMaxRef = useRef<HTMLInputElement>(null);
  const tfPerRef = useRef<HTMLSelectElement>(null);
  const tfLvlRef = useRef<HTMLInputElement>(null);
  const taskFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(new Date());
      autoReset();
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => () => window.clearTimeout(armTimer.current), []);

  function triggerArm(key: string, action: () => void) {
    if (armed === key) {
      window.clearTimeout(armTimer.current);
      setArmed(null);
      action();
      return;
    }
    window.clearTimeout(armTimer.current);
    setArmed(key);
    armTimer.current = window.setTimeout(() => setArmed((a) => (a === key ? null : a)), 3000);
  }

  function toggleInfo(id: string) {
    setOpenRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleCharForm() {
    setTaskFormOpen(false);
    setCharFormOpen((open) => {
      const next = !open;
      if (next && cfClassRef.current) cfClassRef.current.value = profile.class ?? '';
      return next;
    });
  }

  function toggleTaskForm() {
    setCharFormOpen(false);
    setTaskFormOpen((open) => !open);
  }

  function handleAddCharacter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = cfNameRef.current?.value.trim() ?? '';
    if (!name) return;
    const cls = cfClassRef.current?.value ?? '';
    const level = parseInt(cfLevelRef.current?.value ?? '', 10) || 1;
    tracker.addCharacter(name, cls, level);
    charFormRef.current?.reset();
    setCharFormOpen(false);
    toast(T('{name} added', { name }));
  }

  function handleAddTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = tfNameRef.current?.value.trim() ?? '';
    if (!name) return;
    const scope = (tfScopeRef.current?.value as 'daily' | 'weekly') ?? 'daily';
    const per = (tfPerRef.current?.value as 'character' | 'account') ?? 'character';
    const mx = parseInt(tfMaxRef.current?.value ?? '', 10);
    const lv = parseInt(tfLvlRef.current?.value ?? '', 10);
    tracker.addCustomTask({
      name,
      scope,
      per,
      max: Number.isNaN(mx) ? null : mx,
      minLevel: Number.isNaN(lv) ? null : lv,
    });
    taskFormRef.current?.reset();
    setTaskFormOpen(false);
    toast(T('Task added'));
  }

  function renderCell(t: Task, cid: string) {
    const key = t.per === 'account' ? '_acct' : cid;
    const v = (tracker.counts[t.id] || {})[key] || 0;
    const done = !!t.max && v >= t.max;
    const cls = 'cnt-btn' + (done ? ' done' : '') + (t.max ? '' : ' free');
    const label = t.max ? `${v} / ${t.max}` : `${v}${t.unit ? ' ' + T(t.unit) : ''}`;
    return (
      <div className="wrap">
        <button
          className={cls}
          title={T('Click +1, right-click or Shift-click -1')}
          onClick={(e) => tracker.bump(t, cid, e.shiftKey ? -1 : 1)}
          onContextMenu={(e) => {
            e.preventDefault();
            tracker.bump(t, cid, -1);
          }}
        >
          {label}
        </button>
        {t.max ? (
          <div className="bar">
            <i style={{ width: Math.min(100, (v / t.max) * 100) + '%' }} />
          </div>
        ) : (
          <div className="bar none" />
        )}
      </div>
    );
  }

  const dailyMs = nextDaily(now, tracker.settings).getTime() - now.getTime();
  const weeklyMs = nextWeekly(now, tracker.settings).getTime() - now.getTime();
  const visibleTasks = tracker.allTasks.filter((t) => tracker.settings.showHidden || !tracker.hidden[t.id]);
  const wdayName = T(WDAY_NAMES[tracker.settings.wday]);

  return (
    <>
      <div className="trk-head">
        <div>
          <h2>{T('Daily and weekly tracker')}</h2>
          <p className="lead">
            {T(
              'Rows are tasks, columns are your characters. Click a cell to add one run, right-click or Shift-click to remove one. Counters reset automatically at the reset times you set below. Global reset times were not published when compiled, so set them once the game is live.',
            )}
          </p>
        </div>
        <div className="timers">
          <div>
            <span>{T('Next daily reset')}</span>
            <b>{fmtCountdown(dailyMs)}</b>
          </div>
          <div>
            <span>{T('Next weekly reset')}</span>
            <b>{fmtCountdown(weeklyMs)}</b>
          </div>
        </div>
      </div>
      <div className="trk-bar">
        <label>
          {T('Daily reset')} <input type="time" value={tracker.settings.daily} onChange={(e) => tracker.setDaily(e.target.value)} />
        </label>
        <label>
          {T('Weekly reset')}{' '}
          <select value={tracker.settings.wday} onChange={(e) => tracker.setWday(Number(e.target.value))}>
            <option value={3}>{T('Wednesday')}</option>
            <option value={0}>{T('Sunday')}</option>
            <option value={1}>{T('Monday')}</option>
            <option value={2}>{T('Tuesday')}</option>
            <option value={4}>{T('Thursday')}</option>
            <option value={5}>{T('Friday')}</option>
            <option value={6}>{T('Saturday')}</option>
          </select>
        </label>
        <label>
          <input type="checkbox" checked={tracker.settings.showAll} onChange={(e) => tracker.setShowAll(e.target.checked)} />{' '}
          {T('Show locked tasks')}
        </label>
        <label>
          <input type="checkbox" checked={tracker.settings.showHidden} onChange={(e) => tracker.setShowHidden(e.target.checked)} />{' '}
          {T('Show hidden tasks')}
        </label>
        <label>
          <input type="checkbox" checked={tracker.settings.showDetails} onChange={(e) => tracker.setShowDetails(e.target.checked)} />{' '}
          {T('Show task details')}
        </label>
        <span className="classnav">
          <button onClick={toggleCharForm}>{T('+ Character')}</button>
          <button onClick={toggleTaskForm}>{T('+ Custom task')}</button>
          <button
            className={'confirmable' + (armed === 'reset-daily' ? ' arm' : '')}
            onClick={() =>
              triggerArm('reset-daily', () => {
                tracker.wipe('daily');
                toast(T('Daily counters reset'));
              })
            }
          >
            {armed === 'reset-daily' ? T('Confirm reset') : T('Reset daily')}
          </button>
          <button
            className={'confirmable' + (armed === 'reset-weekly' ? ' arm' : '')}
            onClick={() =>
              triggerArm('reset-weekly', () => {
                tracker.wipe('weekly');
                toast(T('Weekly counters reset'));
              })
            }
          >
            {armed === 'reset-weekly' ? T('Confirm reset') : T('Reset weekly')}
          </button>
        </span>
      </div>
      <form className="addform" hidden={!charFormOpen} ref={charFormRef} onSubmit={handleAddCharacter}>
        <label>
          {T('Name')}
          <input ref={cfNameRef} required maxLength={24} placeholder={T('Character name')} />
        </label>
        <label>
          {T('Class')}
          <select ref={cfClassRef} defaultValue="">
            <option value="">{T('Unknown')}</option>
            {CLASSES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {T('Level')}
          <input ref={cfLevelRef} type="number" min={1} max={99} defaultValue={1} />
        </label>
        <button type="submit" className="btn primary">
          {T('Add character')}
        </button>
        <button type="button" className="btn" onClick={() => setCharFormOpen(false)}>
          {T('Cancel')}
        </button>
      </form>
      <form className="addform" hidden={!taskFormOpen} ref={taskFormRef} onSubmit={handleAddTask}>
        <label>
          {T('Task name')}
          <input ref={tfNameRef} required maxLength={40} placeholder={T('e.g. World boss')} />
        </label>
        <label>
          {T('Resets')}
          <select ref={tfScopeRef} defaultValue="daily">
            <option value="daily">{T('Daily')}</option>
            <option value="weekly">{T('Weekly')}</option>
          </select>
        </label>
        <label>
          {T('Limit per reset')}
          <input ref={tfMaxRef} type="number" min={1} max={999} placeholder={T('blank = counter')} />
        </label>
        <label>
          {T('Tracked per')}
          <select ref={tfPerRef} defaultValue="character">
            <option value="character">{T('Character')}</option>
            <option value="account">{T('Account')}</option>
          </select>
        </label>
        <label>
          {T('Unlocks at level')}
          <input ref={tfLvlRef} type="number" min={1} max={99} placeholder={T('any')} />
        </label>
        <button type="submit" className="btn primary">
          {T('Add task')}
        </button>
        <button type="button" className="btn" onClick={() => setTaskFormOpen(false)}>
          {T('Cancel')}
        </button>
      </form>
      <div className={'tbl trk' + (tracker.settings.showDetails ? ' details' : '')}>
        {tracker.chars.length === 0 ? (
          <div className="empty" dangerouslySetInnerHTML={TH('No characters yet. Use <b>+ Character</b> above to add your first one.')} />
        ) : (
          <table>
            <thead>
              <tr>
                <th className="taskcol">{T('Task')}</th>
                {tracker.chars.map((c) => (
                  <th key={c.id}>
                    <button
                      className={'x' + (armed === 'del-' + c.id ? ' arm' : '')}
                      title={T('Remove character')}
                      onClick={() =>
                        triggerArm('del-' + c.id, () => {
                          tracker.removeCharacter(c.id);
                          toast(T('{name} removed', { name: c.name }));
                        })
                      }
                    >
                      {armed === 'del-' + c.id ? T('Remove?') : '✕'}
                    </button>
                    <div className="ch">
                      <div className="ico">
                        <Icon name={c.cls || 'person'} />
                      </div>
                      <b>{c.name}</b>
                      <small>
                        {c.cls ? CLASS_NAME[c.cls] + ' · ' : ''}
                        {'Lv '}
                        <input
                          className="lvin"
                          type="number"
                          min={1}
                          max={99}
                          defaultValue={c.level}
                          title={T('Level')}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (v) tracker.setCharacterLevel(c.id, v);
                          }}
                        />
                      </small>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(['daily', 'weekly'] as const).map((scope) => {
                const rows = visibleTasks.filter((t) => t.scope === scope);
                if (!rows.length) return null;
                return (
                  <Fragment key={scope}>
                    <tr className="grp">
                      <td colSpan={tracker.chars.length + 1}>
                        {T(scope)} ·{' '}
                        {scope === 'daily'
                          ? T('resets every day at {t}', { t: tracker.settings.daily })
                          : T('resets weekly on {d} at {t}', { d: wdayName, t: tracker.settings.daily })}
                      </td>
                    </tr>
                    {rows.map((t) => (
                      <tr key={t.id} className={openRows.has(t.id) ? 'open' : ''}>
                        <td className="taskcol">
                          <div className="tname">
                            <strong title={T(t.name)}>{T(t.name)}</strong>
                            <span className="lim">{taskLimitText(t, T)}</span>
                            <button className={'info' + (openRows.has(t.id) ? ' on' : '')} title={T('Details')} onClick={() => toggleInfo(t.id)}>
                              i
                            </button>
                            <button
                              className="hide"
                              title={tracker.hidden[t.id] ? T('Unhide task') : T('Hide task')}
                              onClick={() => tracker.toggleHidden(t.id)}
                            >
                              {tracker.hidden[t.id] ? '↺' : '✕'}
                            </button>
                          </div>
                          <div className="detail">
                            {T(t.group || '')}
                            {t.note ? ' · ' + T(t.note) : ''}{' '}
                            {t.src && (
                              <a className="src" href={t.src} target="_blank" rel="noopener">
                                {t.srcLabel || 'src'}
                              </a>
                            )}
                            {t.confidence === 'contested' && <span className="badge conf-contested">{T('contested')}</span>}
                            {t.confidence === 'single' && <span className="badge conf-single">{T('single source')}</span>}
                            {t.krEra && <span className="badge kr-era">{T('KR-era')}</span>}
                          </div>
                        </td>
                        {t.per === 'account'
                          ? (
                              <td className="cell" colSpan={tracker.chars.length}>
                                {renderCell(t, '_acct')}
                              </td>
                            )
                          : tracker.chars.map((c) => {
                              const locked = !!t.minLevel && c.level < t.minLevel;
                              if (locked && !tracker.settings.showAll) {
                                return (
                                  <td key={c.id} className="na" title={T('Below unlock level')}>
                                    ·
                                  </td>
                                );
                              }
                              return (
                                <td key={c.id} className={'cell' + (locked ? ' locked' : '')}>
                                  {renderCell(t, c.id)}
                                </td>
                              );
                            })}
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
