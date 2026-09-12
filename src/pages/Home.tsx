import { useNavigate } from 'react-router-dom';
import type { Meta } from '../content-types';
import { LAUNCH } from '../lib/data';
import { useLang } from '../lib/i18n';
import { useRoadmapProgress } from '../lib/progress';
import { RoadmapSummary } from '../components/RoadmapSummary';
import { ClassTiles, SectionTiles } from '../components/Tiles';
import metaJson from '../generated/meta.json';

const meta = metaJson as unknown as Meta;

interface Countdown {
  days: number | null;
  label: string;
}

function countdown(T: (text: string, vars?: Record<string, string | number>) => string): Countdown {
  const now = new Date();
  const ea = LAUNCH.advanceAccess;
  const la = LAUNCH.global;
  if (now < ea) {
    return {
      days: Math.ceil((ea.getTime() - now.getTime()) / 86400000),
      label: T('days until Founder advance access (2026-09-30)'),
    };
  }
  if (now < la) {
    return {
      days: Math.ceil((la.getTime() - now.getTime()) / 86400000),
      label: T('days until global launch (2026-10-05)'),
    };
  }
  return { days: null, label: T('global launched 2026-10-05, re-verify KR-era data') };
}

export function Home() {
  const { T, TH } = useLang();
  const navigate = useNavigate();
  const progress = useRoadmapProgress();
  const cd = countdown(T);

  return (
    <section className="page active" data-title={T('Home')}>
      <div className="hero">
        <div>
          <h2>{T('AION 2 Beginner Compendium')}</h2>
          <p>
            {T(
              'Everything a new Daeva needs before the 2026-10-05 global launch: what to do first, how each system works, where to spend energy and money, and a sourced guide for each of the 8 classes. Every fact links to where it came from.',
            )}
          </p>
        </div>
        <div className="hero-cd">
          <span className="n">{cd.days ?? T('Live')}</span>
          <span className="lbl">{cd.label}</span>
        </div>
      </div>
      <div className="quick-actions">
        <button className="btn primary" onClick={() => navigate('/start')}>
          {T('Start here')}
        </button>
        <button className="btn" onClick={() => navigate('/roadmap')}>
          {T('Open my roadmap')}
        </button>
        <button className="btn" onClick={() => navigate('/classes')}>
          {T('Pick a class')}
        </button>
      </div>
      <div className="stats">
        <div className="stat">
          <b>{meta.cards}</b>
          <span>{T('guide cards')}</span>
        </div>
        <div className="stat">
          <b>{meta.sourceLinks}</b>
          <span>{T('source links')}</span>
        </div>
        <div className="stat">
          <b>{progress.overallPct}%</b>
          <span>{T('roadmap complete')}</span>
        </div>
      </div>
      <div
        className="banner"
        dangerouslySetInnerHTML={TH(
          '<strong>Read this first:</strong> the global version was not live when this was compiled. Most numbers come from the Korean/Taiwanese release (Nov 2025 onward). Badges show confidence; purple <span class="badge kr-era">KR-era</span> means it may change at launch. Spot checks found roughly one in seven source chips imprecise, so click a source chip before acting on a number.',
        )}
      />
      <div className="sec-title">
        <h3>{T('Your progress')}</h3>
        <span>{T('saved in this browser, export a backup from the roadmap page')}</span>
      </div>
      <div className="progress-card">
        <RoadmapSummary />
      </div>
      <div className="sec-title">
        <h3>{T('Guide sections')}</h3>
        <span>{T('click a tile')}</span>
      </div>
      <div className="tiles tiles-sections">
        <SectionTiles />
      </div>
      <div className="sec-title">
        <h3>{T('Classes')}</h3>
        <span>{T('role, difficulty, and a full guide each')}</span>
      </div>
      <div className="tiles tiles-classes">
        <ClassTiles />
      </div>
    </section>
  );
}
