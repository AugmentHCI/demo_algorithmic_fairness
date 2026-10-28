import { getContext, setContext } from 'svelte';
import type { Attachment } from 'svelte/attachments';

/**
 * Whether the reader has seen the end of a screen's content, so the way
 * onwards can wait until everything above it has had a chance to be read
 * (see `AtScreenEnd`). A screen that fits counts as read straight away.
 *
 * Until then, `near` tells when the end is already on screen, only still
 * behind the call-to-action bar: all content shows, yet the way onwards
 * doesn't, so it should hint that there is more below.
 *
 * Scrolling back up leaves the end reached. Content growing past the bottom
 * of the screen (a result appearing, a list loading) asks for it again, and
 * only scrolling can then reach it: otherwise hiding the way onwards would
 * shrink the call-to-action bar, uncover the end and show it again at once.
 *
 * `Screen` creates one, puts `marker` on an empty element right after its
 * content and `bar` on its call-to-action bar, which covers part of the screen.
 */
export class ScreenEnd {
	#reached = $state(false);
	#near = $state(false);
	/** Whether the end was in view on the very first look, i.e. the screen fits. */
	#fits = false;

	#marker: HTMLElement | undefined;
	#bar: HTMLElement | undefined;
	#observer: IntersectionObserver | undefined;

	/** Whether the observer has reported at all, since `#fits` is decided on its first report. */
	#looked = false;
	/** Whether the marker is in view, clear of the call-to-action bar. */
	#inView = false;
	/** Whether the content grew since the observer last reported. */
	#grew = false;
	/** Set when growth hid the way onwards: only scrolling may bring it back. */
	#awaitingScroll = false;

	get reached(): boolean {
		return this.#reached;
	}

	/** Whether the end of the content is on screen, though maybe still behind the call-to-action bar. */
	get near(): boolean {
		return this.#near;
	}

	/** Whether the way onwards needs no entrance: the screen fit from the start. */
	get fits(): boolean {
		return this.#fits;
	}

	/** For an empty element right after the content; its parent's growth is watched. */
	readonly marker: Attachment<HTMLElement> = (marker) => {
		if (typeof IntersectionObserver === 'undefined' || typeof ResizeObserver === 'undefined') {
			// Nothing to tell where the reader is: never hold the way onwards back.
			this.#fits = this.#reached = true;
			return;
		}

		this.#marker = marker;
		this.#connect();

		// Against the whole viewport, bar or not: unlike `#observer`, never needs reconnecting.
		const onScreen = new IntersectionObserver((entries) => {
			const entry = entries.at(-1);
			if (entry) this.#near = entry.isIntersecting;
		});
		onScreen.observe(marker);

		let height: number | undefined;
		const growth = new ResizeObserver(([entry]) => {
			const next = entry?.borderBoxSize[0]?.blockSize;
			if (next === undefined) return;
			const grew = height !== undefined && next > height;
			height = next;
			if (!grew) return;
			// Re-observing makes the observer report afresh, also when the marker didn't move out of view.
			this.#grew = true;
			this.#observer?.unobserve(marker);
			this.#observer?.observe(marker);
		});
		if (marker.parentElement) growth.observe(marker.parentElement);

		const onScroll = () => {
			this.#awaitingScroll = false;
			this.#update();
		};
		window.addEventListener('scroll', onScroll, { passive: true });

		return () => {
			window.removeEventListener('scroll', onScroll);
			growth.disconnect();
			onScreen.disconnect();
			this.#observer?.disconnect();
			this.#observer = undefined;
			this.#marker = undefined;
		};
	};

	/** For the call-to-action bar: the end counts as seen only once it clears the bar. */
	readonly bar: Attachment<HTMLElement> = (bar) => {
		if (typeof ResizeObserver === 'undefined') return;
		this.#bar = bar;
		const resize = new ResizeObserver(() => this.#connect());
		resize.observe(bar);
		return () => {
			resize.disconnect();
			this.#bar = undefined;
			this.#connect();
		};
	};

	/** (Re)start observing the marker, against the bar's current height. */
	#connect(): void {
		this.#observer?.disconnect();
		this.#observer = undefined;
		const marker = this.#marker;
		if (!marker) return;
		const covered = this.#bar?.offsetHeight ?? 0;
		this.#observer = new IntersectionObserver((entries) => this.#see(entries.at(-1)), {
			rootMargin: `0px 0px -${covered}px 0px`
		});
		this.#observer.observe(marker);
	}

	#see(entry: IntersectionObserverEntry | undefined): void {
		if (!entry) return;
		this.#inView = entry.isIntersecting;
		if (!this.#looked) {
			this.#looked = true;
			this.#fits = this.#inView;
		}
		if (this.#grew) {
			this.#grew = false;
			if (!this.#inView && this.#reached) {
				this.#reached = false;
				this.#awaitingScroll = true;
				this.#fits = false;
			}
		}
		this.#update();
	}

	#update(): void {
		if (this.#inView && !this.#awaitingScroll) this.#reached = true;
	}
}

const KEY = Symbol('screen-end');

export function setScreenEnd(end: ScreenEnd): ScreenEnd {
	return setContext(KEY, end);
}

export function getScreenEnd(): ScreenEnd {
	const end = getContext<ScreenEnd | undefined>(KEY);
	if (!end) throw new Error('getScreenEnd() must be called inside a Screen');
	return end;
}
