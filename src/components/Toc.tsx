import { useEffect, useState } from 'react';
import type { CardBlock } from '../content-types';
import { useLang } from '../lib/i18n';

interface TocProps {
  cards: CardBlock[];
  onNavigate: (id: string) => void;
  /** Set to false when an ancestor (e.g. the <summary> of a dropdown) already shows the label. */
  showLabel?: boolean;
}

/**
 * Table of contents with scroll-spy. Rendered twice by GuideBody /
 * Layout for the same page: once inside the collapsible `.toc-drop` dropdown (viewports under
 * 1280px, label comes from the dropdown's <summary>) and once in the sticky `.toc-rail` column
 * (1280px and up, via Layout). CSS shows exactly one of the two at any width.
 */
export function Toc({ cards, onNavigate, showLabel = true }: TocProps) {
  const { T } = useLang();
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    function spy() {
      let best: string | null = null;
      for (const c of cards) {
        const el = document.getElementById(c.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - 90 <= 0) best = c.id;
      }
      setActive(best ?? cards[0]?.id ?? null);
    }
    spy();
    let timer: number | undefined;
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(spy, 60);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(timer);
    };
  }, [cards]);

  return (
    <nav className="toc">
      {showLabel ? <b>{T('On this page')}</b> : null}
      {cards.map((c, i) => (
        <a
          key={c.id}
          href="#"
          className={active === c.id ? 'on' : ''}
          onClick={(e) => {
            e.preventDefault();
            onNavigate(c.id);
          }}
        >
          {i + 1}. {c.title}
        </a>
      ))}
    </nav>
  );
}
