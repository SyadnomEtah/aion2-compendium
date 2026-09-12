import type { KeyboardEvent, MouseEvent } from 'react';
import type { SourcesBlock } from '../content-types';
import { useLang } from '../lib/i18n';

interface SourcesCardProps {
  id: string;
  card: SourcesBlock;
  collapsed: boolean;
  onToggle: () => void;
  flashed: boolean;
}

/** The single merged sources card, always last on a page and collapsed by default. */
export function SourcesCard({ id, card, collapsed, onToggle, flashed }: SourcesCardProps) {
  const { T } = useLang();

  function handleHeaderClick(e: MouseEvent<HTMLElement>) {
    if ((e.target as HTMLElement).closest('a')) return;
    onToggle();
  }

  function handleHeaderKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  }

  const className = ['card', 'sources-card', collapsed ? 'collapsed' : '', flashed ? 'flash' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <article id={id} className={className}>
      <header
        className="card-h"
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        aria-controls={id + '-body'}
        onClick={handleHeaderClick}
        onKeyDown={handleHeaderKeyDown}
      >
        <h3>{card.title}</h3>
        <span className="meta">{T('{n} links', { n: card.linkCount })}</span>
      </header>
      <div className="card-bwrap" id={id + '-body'}>
        <div className="card-b-inner">
          <div className="card-b" dangerouslySetInnerHTML={{ __html: card.bodyHtml }} />
        </div>
      </div>
    </article>
  );
}
