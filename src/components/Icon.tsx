import { ICON } from '../lib/data';

/** Renders one of the inline SVG icons from lib/data.ts. `name` falls back to the generic person icon. */
export function Icon({ name, className }: { name: string; className?: string }) {
  const svg = ICON[name] ?? ICON.person;
  return <span className={className} dangerouslySetInnerHTML={{ __html: svg }} />;
}
