import type { Block } from '../content-types';
import { Card } from './Card';
import { ClassHead } from './ClassHead';
import { SourcesCard } from './SourcesCard';

interface BlockRendererProps {
  blocks: Block[];
  /** used to derive the merged sources card's id: `${pageId}-sources` */
  pageId: string;
  classId?: string;
  collapsed: Record<string, boolean>;
  onToggleCard: (id: string) => void;
  sourcesCollapsed: boolean;
  onToggleSources: () => void;
  flashId: string | null;
  classCompact: boolean;
  onToggleClassCompact: () => void;
}

/**
 * Renders a PageData's blocks in order. Shared by GuidePage and ClassesPage (via GuideBody) so
 * the card/classHead/sourcesCard rendering rules live in exactly one place. `phase` blocks render
 * nothing here; the roadmap page has its own renderer.
 */
export function BlockRenderer({
  blocks,
  pageId,
  classId,
  collapsed,
  onToggleCard,
  sourcesCollapsed,
  onToggleSources,
  flashId,
  classCompact,
  onToggleClassCompact,
}: BlockRendererProps) {
  const sourcesId = `${pageId}-sources`;

  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'html':
            return <div key={i} dangerouslySetInnerHTML={{ __html: block.html }} />;
          case 'classHead':
            return (
              <ClassHead
                key={i}
                block={block}
                classId={classId}
                compact={classCompact}
                onToggleCompact={onToggleClassCompact}
              />
            );
          case 'card':
            return (
              <Card
                key={block.id}
                card={block}
                collapsed={!!collapsed[block.id]}
                onToggle={() => onToggleCard(block.id)}
                flashed={flashId === block.id}
              />
            );
          case 'sourcesCard':
            return (
              <SourcesCard
                key="sources"
                id={sourcesId}
                card={block}
                collapsed={sourcesCollapsed}
                onToggle={onToggleSources}
                flashed={flashId === sourcesId}
              />
            );
          case 'phase':
            return null;
          default:
            return null;
        }
      })}
    </>
  );
}
