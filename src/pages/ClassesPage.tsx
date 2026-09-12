import { GuideBody } from '../components/GuideBody';
import { ClassTiles } from '../components/Tiles';
import { useLang } from '../lib/i18n';

/** The classes overview page: intro, class tiles, "Compare" title, then the picker fragment's blocks. */
export function ClassesPage() {
  const { T } = useLang();
  return (
    <GuideBody
      pageId="classes"
      before={
        <>
          <div className="intro">
            <h2>{T('Class guides')}</h2>
            <p className="lead">
              {T(
                'Pick a class tile for the full guide: skill priority, stigma picks, Daevanion route, Arcana, gear and stat priority, rotation, leveling notes, mistakes. Info is mostly KR/TW-era theorycraft, expect balance changes at global launch.',
              )}
            </p>
          </div>
          <div className="tiles tiles-classes">
            <ClassTiles />
          </div>
          <div className="sec-title">
            <h3>{T('Compare')}</h3>
          </div>
        </>
      }
    />
  );
}
