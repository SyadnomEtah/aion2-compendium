import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import type { Meta } from '../content-types';
import { CLASSES } from '../lib/data';
import { useLang } from '../lib/i18n';
import { useRoadmapProgress } from '../lib/progress';
import { storeGet, storeSet } from '../lib/store';
import { Icon } from './Icon';
import metaJson from '../generated/meta.json';

const meta = metaJson as unknown as Meta;

interface SidebarProps {
  open: boolean;
  onNavigate: () => void;
}

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const { T } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const progress = useRoadmapProgress();
  const [collapsed, setCollapsed] = useState<boolean>(() => storeGet('nav', false));
  const current = location.pathname === '/' ? 'home' : location.pathname.slice(1);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      storeSet('nav', next);
      return next;
    });
  }

  function go(id: string) {
    navigate(id === 'home' ? '/' : '/' + id);
    onNavigate();
  }

  function count(id: string): string {
    const n = meta.pageCounts[id];
    return n ? String(n) : '';
  }

  function activeClass(id: string): string {
    return current === id ? ' active' : '';
  }

  return (
    <aside className={(open ? 'side open' : 'side') + (collapsed ? ' collapsed' : '')} id="side">
      <button className="brand" onClick={() => go('home')} title={T('AION 2 Compendium')}>
        <div className="wing" />
        <div>
          <h1>{T('AION 2 Compendium')}</h1>
          <small>{T('Beginner guide, compiled 2026-09-12')}</small>
        </div>
      </button>
      <button
        className="rail-toggle"
        onClick={toggleCollapsed}
        title={collapsed ? T('Expand sidebar') : T('Collapse sidebar')}
        aria-label={collapsed ? T('Expand sidebar') : T('Collapse sidebar')}
        aria-expanded={!collapsed}
      >
        {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
      </button>
      <div className="sgroup">
        <span className="label">{T('Getting started')}</span>
        <button className={'nav-btn' + activeClass('home')} onClick={() => go('home')} title={T('Home')}>
          <Icon name="home" />
          <span className="label">{T('Home')}</span>
        </button>
        <button className={'nav-btn' + activeClass('start')} onClick={() => go('start')} title={T('Start Here')}>
          <Icon name="start" />
          <span className="label">{T('Start Here')}</span>
          <span className="cnt">{count('start')}</span>
        </button>
        <button className={'nav-btn' + activeClass('priorities')} onClick={() => go('priorities')} title={T('Priorities')}>
          <Icon name="priorities" />
          <span className="label">{T('Priorities')}</span>
          <span className="cnt">{count('priorities')}</span>
        </button>
        <button className={'nav-btn' + activeClass('avoid')} onClick={() => go('avoid')} title={T('What to avoid')}>
          <Icon name="avoid" />
          <span className="label">{T('What to avoid')}</span>
          <span className="cnt">{count('avoid')}</span>
        </button>
      </div>
      <div className="sgroup">
        <span className="label">{T('Knowledge')}</span>
        <button className={'nav-btn' + activeClass('systems')} onClick={() => go('systems')} title={T('Systems')}>
          <Icon name="systems" />
          <span className="label">{T('Systems')}</span>
          <span className="cnt">{count('systems')}</span>
        </button>
        <button className={'nav-btn' + activeClass('dungeons')} onClick={() => go('dungeons')} title={T('Dungeons & Energy')}>
          <Icon name="dungeons" />
          <span className="label">{T('Dungeons & Energy')}</span>
          <span className="cnt">{count('dungeons')}</span>
        </button>
        <button className={'nav-btn' + activeClass('money')} onClick={() => go('money')} title={T('Premium & Spending')}>
          <Icon name="money" />
          <span className="label">{T('Premium & Spending')}</span>
          <span className="cnt">{count('money')}</span>
        </button>
      </div>
      <div className="sgroup">
        <span className="label">{T('Classes')}</span>
        <button className={'nav-btn' + activeClass('classes')} onClick={() => go('classes')} title={T('All classes')}>
          <Icon name="classes" />
          <span className="label">{T('All classes')}</span>
        </button>
        <div>
          {CLASSES.map((c) => (
            <button
              key={c.id}
              className={'nav-btn role-' + c.role + activeClass('class-' + c.id)}
              onClick={() => go('class-' + c.id)}
              title={c.name}
            >
              <span className="role-dot" aria-hidden="true" />
              <Icon name={c.id} />
              <span className="label">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="sgroup">
        <span className="label">{T('Tools')}</span>
        <button className={'nav-btn' + activeClass('roadmap')} onClick={() => go('roadmap')} title={T('Progression roadmap')}>
          <Icon name="roadmap" />
          <span className="label">{T('Progression roadmap')}</span>
          <span className="cnt">{progress.total ? progress.overallPct + '%' : ''}</span>
        </button>
        <button className={'nav-btn' + activeClass('checklist')} onClick={() => go('checklist')} title={T('Daily / Weekly')}>
          <Icon name="checklist" />
          <span className="label">{T('Daily / Weekly')}</span>
        </button>
        <button className={'nav-btn' + activeClass('sources')} onClick={() => go('sources')} title={T('Sources & Glossary')}>
          <Icon name="sources" />
          <span className="label">{T('Sources & Glossary')}</span>
        </button>
      </div>
      <div className="foot">
        <span className="foot-text">
          {T('KR/TW-era data, re-verify after 2026-10-05.')}
          <br />
          {T('Progress is saved in this browser.')}
          <br />
        </span>
      </div>
    </aside>
  );
}
