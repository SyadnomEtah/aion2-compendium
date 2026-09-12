import { useNavigate } from 'react-router-dom';
import type { ClassHeadBlock } from '../content-types';
import { CLASSES, ICON } from '../lib/data';
import { useLang } from '../lib/i18n';

interface ClassHeadProps {
  block: ClassHeadBlock;
  classId?: string;
  compact: boolean;
  onToggleCompact: () => void;
}

/**
 * Class page header: back row (all classes + compact toggle + class nav) followed by the
 * class-head block itself with its icon injected.
 */
export function ClassHead({ block, classId, compact, onToggleCompact }: ClassHeadProps) {
  const { T } = useLang();
  const navigate = useNavigate();
  const icon = (classId && ICON[classId]) || ICON.person;

  return (
    <>
      <div className="backrow">
        <button className="btn" onClick={() => navigate('/classes')}>
          {'← ' + T('All classes')}
        </button>
        <button
          className={compact ? 'btn cmp-toggle on' : 'btn cmp-toggle'}
          title={T(
            'Compact view keeps the In-short lines, priority lists, rotations, tables and tips. Full view shows everything with citations.',
          )}
          onClick={onToggleCompact}
        >
          {compact ? T('Compact view: on') : T('Compact view')}
        </button>
        <span className="classnav" role="tablist" aria-label={T('Switch class')}>
          {CLASSES.map((k) => (
            <button
              key={k.id}
              role="tab"
              aria-selected={k.id === classId}
              className={k.id === classId ? 'active' : ''}
              onClick={() => navigate('/class-' + k.id)}
            >
              {k.name}
            </button>
          ))}
        </span>
      </div>
      <div className="class-head" data-role={block.role}>
        <div className="ico" dangerouslySetInnerHTML={{ __html: icon }} />
        <div dangerouslySetInnerHTML={{ __html: block.html }} />
      </div>
    </>
  );
}
