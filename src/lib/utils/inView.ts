import type { Attachment } from 'svelte/attachments';
import { visibleArea } from './reveal';

/** Steps at which the observer reports, fine enough to catch `share` without polling. */
const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);

/**
 * Call `onVisible` once, as soon as the element is really in view: at least
 * `share` of it on screen, clear of the sticky header and call to action. An
 * element too tall to show that much of counts as in view once it fills
 * `share` of the visible area. Used to hold an animation back until the reader
 * has scrolled to it.
 *
 * Usage: `<div {@attach onceInView(() => (started = true))}>`.
 */
export function onceInView(onVisible: () => void, share = 0.6): Attachment {
	return (element) => {
		if (typeof IntersectionObserver === 'undefined') {
			onVisible();
			return;
		}
		const { top, bottom } = visibleArea();
		const visibleHeight = bottom - top;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry?.isIntersecting) return;
				const shown = entry.intersectionRect.height;
				if (entry.intersectionRatio >= share || shown >= visibleHeight * share) {
					observer.disconnect();
					onVisible();
				}
			},
			{
				rootMargin: `-${top}px 0px -${window.innerHeight - bottom}px 0px`,
				threshold: THRESHOLDS
			}
		);
		observer.observe(element);
		return () => observer.disconnect();
	};
}
