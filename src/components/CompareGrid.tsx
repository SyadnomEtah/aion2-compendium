import { useNavigate } from 'react-router-dom';
import type { CompareTable } from '../content-types';
import { ICON } from '../lib/data';
import { useLang } from '../lib/i18n';

/** Class comparison grid: one `.c` card per row of the classes page compare table. */
export function CompareGrid({ compare }: { compare: CompareTable }) {
  const { T } = useLang();
  const navigate = useNavigate();

  return (
    <div className="cmp">
      {compare.rows.map((row, ri) => (
        <div className="c" key={row.classId ?? row.name + ri}>
          <div className="hd">
            <div
              className="ico"
              dangerouslySetInnerHTML={{ __html: (row.classId && ICON[row.classId]) || '' }}
            />
            {row.classId ? (
              <b>
                <button className="linkish" onClick={() => navigate('/class-' + row.classId)}>
                  {row.name}
                </button>
              </b>
            ) : (
              <b>{row.name}</b>
            )}
          </div>
          <dl>
            {row.cellsHtml.map((html, i) => {
              const headIdx = i + 1;
              const headEn = compare.headsEn[headIdx] ?? '';
              const head = compare.heads[headIdx] ?? '';
              const isSources = /^src/i.test(headEn);
              const label = isSources ? T('Sources') : head.replace(/\s*\(.*?\)\s*/g, '');
              return (
                <div key={i}>
                  <dt>{label}</dt>
                  <dd dangerouslySetInnerHTML={{ __html: html }} />
                </div>
              );
            })}
          </dl>
        </div>
      ))}
    </div>
  );
}
