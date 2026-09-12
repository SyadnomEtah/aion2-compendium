import type { KeyboardEvent, MouseEvent } from 'react';
import type { CardBlock } from '../content-types';
import { CompareGrid } from './CompareGrid';

interface CardProps {
  card: CardBlock;
  collapsed: boolean;
  onToggle: () => void;
  flashed: boolean;
}

/** One guide card. Header click toggles collapse, ignoring clicks on links so that following a link doesn't also collapse the card. */
export function Card({ card, collapsed, onToggle, flashed }: CardProps) {
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

  const className = ['card', collapsed ? 'collapsed' : '', flashed ? 'flash' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <article id={card.id} className={className} data-tags={card.tags}>
      <header
        className="card-h"
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        aria-controls={card.id + '-body'}
        onClick={handleHeaderClick}
        onKeyDown={handleHeaderKeyDown}
      >
        <h3>{card.title}</h3>
        {card.headExtrasHtml ? (
          <span className="headx" dangerouslySetInnerHTML={{ __html: card.headExtrasHtml }} />
        ) : null}
      </header>
      <div className="card-bwrap" id={card.id + '-body'}>
        <div className="card-b-inner">
          {card.compare ? (
            <div className="card-b">
              <div dangerouslySetInnerHTML={{ __html: card.bodyHtml }} />
              <CompareGrid compare={card.compare} />
              {card.bodyAfterHtml ? (
                <div dangerouslySetInnerHTML={{ __html: card.bodyAfterHtml }} />
              ) : null}
            </div>
          ) : (
            <div className="card-b" dangerouslySetInnerHTML={{ __html: card.bodyHtml }} />
          )}
        </div>
      </div>
    </article>
  );
}
