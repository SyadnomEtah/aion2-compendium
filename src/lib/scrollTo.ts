// Scrolls a card or phase element into view by id, offset from the top (used by the TOC).
// This is one of the two permitted direct DOM reads (the other is TopBar's scroll-spy).

export function scrollToCard(id: string, offset: number): void {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: y, behavior: 'smooth' });
}
