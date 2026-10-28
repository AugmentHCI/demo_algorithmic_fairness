/** Helpers for choreographing Web Animations across elements. */

export interface GlideOptions {
	readonly duration: number;
	/** Extra delay per element, in the order of `elements`. */
	readonly stagger?: number;
	readonly easing?: string;
}

/** Each element's on-screen box, by key. */
export function measure(elements: ReadonlyMap<string, Element>): Map<string, DOMRect> {
	return new Map([...elements].map(([key, el]) => [key, el.getBoundingClientRect()]));
}

/**
 * FLIP: glide each element from where it was (`from`, measured earlier, possibly
 * on another element that stood in for it) to where it is now, scaling along if
 * the sizes differ. Elements without a starting box, or that did not move, stay put.
 */
export function glideFrom(
	elements: ReadonlyMap<string, HTMLElement>,
	from: ReadonlyMap<string, DOMRect>,
	{ duration, stagger = 0, easing = 'ease-out' }: GlideOptions
): Animation[] {
	const glides: Animation[] = [];
	for (const [key, el] of elements) {
		const old = from.get(key);
		if (!old) continue;
		const now = el.getBoundingClientRect();
		const { dx, dy } = offsetBetween(now, centreOf(old));
		const scale = now.width > 0 ? old.width / now.width : 1;
		if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(scale - 1) < 0.01) continue;
		glides.push(
			el.animate(
				[{ transform: `translate(${dx}px, ${dy}px) scale(${scale})` }, { transform: 'none' }],
				{ duration, delay: glides.length * stagger, easing, fill: 'backwards' }
			)
		);
	}
	return glides;
}

/** The translation that moves the centre of `rect` onto `point`. */
export function offsetBetween(
	rect: DOMRect,
	point: { x: number; y: number }
): { dx: number; dy: number } {
	const centre = centreOf(rect);
	return { dx: point.x - centre.x, dy: point.y - centre.y };
}

function centreOf(rect: DOMRect): { x: number; y: number } {
	return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/**
 * Resolve once every animation has finished. When `signal` aborts, the
 * animations are cancelled and this rejects, so a running sequence stops.
 */
export async function animationsDone(
	animations: readonly Animation[],
	signal?: AbortSignal
): Promise<void> {
	const cancelAll = () => {
		for (const animation of animations) animation.cancel();
	};
	if (signal?.aborted) {
		cancelAll();
		throw signal.reason;
	}
	signal?.addEventListener('abort', cancelAll, { once: true });
	try {
		await Promise.all(animations.map((animation) => animation.finished));
	} finally {
		signal?.removeEventListener('abort', cancelAll);
	}
}
