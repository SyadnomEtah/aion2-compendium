// Home page progress block: shows overall roadmap completion plus a mini per-phase breakdown.

import { useNavigate } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useRoadmapProgress } from '../lib/progress';

export function RoadmapSummary() {
  const { T } = useLang();
  const navigate = useNavigate();
  const { overallPct, phases } = useRoadmapProgress();

  return (
    <>
      <div className="overall">
        <div className="progress">
          <i style={{ width: overallPct + '%' }} />
        </div>
        <b>{overallPct}%</b>
        <button className="btn" onClick={() => navigate('/roadmap')}>
          {T('Continue')}
        </button>
      </div>
      <div className="miniphases">
        {phases.map((p) => (
          <div className="mini" key={p.id}>
            <b title={p.title}>{p.title}</b>
            <div className="progress">
              <i style={{ width: p.pct + '%' }} />
            </div>
            {p.pct}%
          </div>
        ))}
      </div>
    </>
  );
}
