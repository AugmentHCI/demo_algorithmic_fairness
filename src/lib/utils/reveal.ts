/** Breathing room kept between the revealed elements and the edges of the visible area. */
const MARGIN_PX = 16;

/**
 * Scroll the window just far enough to show `target` in full, but never so far
 * that `anchor` (something above it the reader still needs) leaves the top of
 * the screen. Elements marked `data-sticky="top"` or `data-sticky="bottom"`
 * (the header, the pinned call to action) cover part of the viewport, so they
 * count as off-screen.
 */
export function revealBelow(anchor: Element, target: Element, behavior: ScrollBehavior): void {
	const { top: visibleTop, bottom: visibleBottom } = visibleArea();
	const overflow = target.getBoundingClientRect().bottom + MARGIN_PX - visibleBottom;
	if (overflow <= 0) return;

	const room = anchor.getBoundingClientRect().top - MARGIN_PX - visibleTop;
	const distance = Math.min(overflow, room);
	if (distance > 0) window.scrollBy({ top: distance, behavior });
}

/** The part of the viewport not covered by the sticky header and call to action, in px. */
export function visibleArea(): { top: number; bottom: number } {
	let top = 0;
	let bottom = window.innerHeight;
	for (const el of document.querySelectorAll<HTMLElement>('[data-sticky]')) {
		const rect = el.getBoundingClientRect();
		if (el.dataset.sticky === 'top') top = Math.max(top, rect.bottom);
		else if (el.dataset.sticky === 'bottom') bottom = Math.min(bottom, rect.top);
	}
	return { top, bottom };
}
