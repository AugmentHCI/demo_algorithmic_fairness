import type { DragOptions } from '@neodrag/svelte';
import { onDestroy } from 'svelte';
import { prefersReducedMotion } from 'svelte/motion';
import { wait } from '$lib/utils/wait';

/**
 * - `ready`: the CV waits to be dragged (or sent with a button)
 * - `dropping`: the CV slides into the box
 * - `computing`: the box shakes
 * - `done`: the box has handed out its score and the CV is back in its place
 */
export type CvDropPhase = 'ready' | 'dropping' | 'computing' | 'done';

const DURATION_MS = {
	dropping: { normal: 500, reduced: 0 },
	computing: { normal: 1300, reduced: 200 }
} as const;

interface CvDropOptions {
	/** Start in `done`, for a CV that already went through the box before a refresh. */
	done?: boolean;
	/** Whether the CV may be sent right now; read reactively. Defaults to always. */
	canSend?: () => boolean;
	/** Called once the box has finished computing. */
	onScored: () => void;
}

/**
 * "Send your CV into the box": the CV can be dragged onto the box or sent with a
 * button, after which it drops in, the box computes and hands out a score.
 *
 * Create it during component initialisation (it cancels a running send when the
 * component is destroyed) and bind the `cv`, `box` and `area` elements.
 */
export class CvDrop {
	#offset = $state({ x: 0, y: 0 });
	#canSend: () => boolean = () => true;
	#onScored: () => void;
	/** Cancels the send in progress, if any. */
	#run: AbortController | undefined;

	phase = $state<CvDropPhase>('ready');
	dragging = $state(false);
	/** True while the dragged CV is over the box, so the box can light up. */
	overBox = $state(false);

	/** The draggable CV. */
	cv = $state<HTMLElement>();
	/** The box the CV is dropped into. */
	box = $state<HTMLElement>();
	/** The area the CV can be dragged around in. */
	area = $state<HTMLElement>();

	readonly busy = $derived(this.phase === 'dropping' || this.phase === 'computing');
	readonly canDrag = $derived.by(() => this.phase === 'ready' && this.#canSend());

	readonly dragOptions: DragOptions = $derived.by(() => ({
		bounds: this.area,
		position: this.#offset,
		disabled: !this.canDrag,
		onDragStart: () => {
			this.dragging = true;
		},
		onDrag: ({ offsetX, offsetY }) => {
			this.#offset = { x: offsetX, y: offsetY };
			this.overBox = this.#isOverBox();
		},
		onDragEnd: () => {
			this.dragging = false;
			const dropped = this.#isOverBox();
			this.overBox = false;
			if (dropped) void this.send();
			else this.#offset = { x: 0, y: 0 };
		}
	}));

	constructor({ done = false, canSend, onScored }: CvDropOptions) {
		this.phase = done ? 'done' : 'ready';
		if (canSend) this.#canSend = canSend;
		this.#onScored = onScored;
		onDestroy(() => this.#run?.abort());
	}

	/** Drop the CV into the box and let the box compute. */
	async send(): Promise<void> {
		if (!this.canDrag) return;
		const run = new AbortController();
		this.#run = run;
		const reduced = prefersReducedMotion.current;
		const duration = (phase: keyof typeof DURATION_MS) =>
			DURATION_MS[phase][reduced ? 'reduced' : 'normal'];

		try {
			this.phase = 'dropping';
			this.#moveIntoBox();
			await wait(duration('dropping'), run.signal);
			this.phase = 'computing';
			await wait(duration('computing'), run.signal);
		} catch {
			// Cancelled by `reset()` or by leaving the screen: whoever cancelled owns the state.
			return;
		}
		this.#offset = { x: 0, y: 0 };
		this.phase = 'done';
		this.#onScored();
	}

	/** Take the CV out of the box and put it back in its place, ready to be sent again. */
	reset(): void {
		this.#run?.abort();
		this.#offset = { x: 0, y: 0 };
		this.dragging = false;
		this.overBox = false;
		this.phase = 'ready';
	}

	/** Whether the centre of the CV is over the box (or just above it, where the slot is). */
	#isOverBox(): boolean {
		if (!this.cv || !this.box) return false;
		const cv = this.cv.getBoundingClientRect();
		const box = this.box.getBoundingClientRect();
		const x = cv.left + cv.width / 2;
		const y = cv.top + cv.height / 2;
		const margin = box.width * 0.25;
		return (
			x > box.left - margin &&
			x < box.right + margin &&
			y > box.top - box.height * 0.4 &&
			y < box.bottom
		);
	}

	/** Move the CV (from wherever it is) onto the slot at the top of the box. */
	#moveIntoBox(): void {
		if (!this.cv || !this.box) return;
		const cv = this.cv.getBoundingClientRect();
		const box = this.box.getBoundingClientRect();
		this.#offset = {
			x: this.#offset.x + box.left + box.width / 2 - (cv.left + cv.width / 2),
			y: this.#offset.y + box.top + box.height * 0.3 - (cv.top + cv.height / 2)
		};
	}
}
