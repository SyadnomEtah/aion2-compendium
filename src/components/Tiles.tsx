import { useNavigate } from 'react-router-dom';
import type { Meta } from '../content-types';
import { CLASSES, ICON, SECTIONS } from '../lib/data';
import { useLang } from '../lib/i18n';
import { storeGet } from '../lib/store';
import metaJson from '../generated/meta.json';

const meta = metaJson as unknown as Meta;

interface Profile {
  class?: string;
}

/** Guide section tiles for the home page. */
export function SectionTiles() {
  const { T } = useLang();
  const navigate = useNavigate();

  return (
    <>
      {SECTIONS.map((s) => {
        const n = meta.pageCounts[s.id];
        return (
          <button key={s.id} className="tile" onClick={() => navigate('/' + s.id)}>
            <span className="num">{n ? n : ''}</span>
            <div className="ico" dangerouslySetInnerHTML={{ __html: s.icon }} />
            <h4>{T(s.name)}</h4>
            <p>{T(s.blurb)}</p>
            <span className="go">{T('Open')} →</span>
          </button>
        );
      })}
    </>
  );
}

/** Class tiles, shared by Home and ClassesPage. */
export function ClassTiles() {
  const { T } = useLang();
  const navigate = useNavigate();
  const profile = storeGet<Profile>('profile', {});

  return (
    <>
      {CLASSES.map((c) => (
        <button
          key={c.id}
          className={profile.class === c.id ? 'tile ctile mine' : 'tile ctile'}
          data-role={c.role}
          data-class={c.id}
          onClick={() => navigate('/class-' + c.id)}
        >
          <div className="ico" dangerouslySetInnerHTML={{ __html: ICON[c.id] }} />
          <span className="role">{T(c.roleName)}</span>
          <h4>{c.name}</h4>
          <p>{T(c.blurb)}</p>
          <span className="go">{T('Class guide')} →</span>
        </button>
      ))}
    </>
  );
}
