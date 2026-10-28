export interface PollOptions<T> {
	readonly intervalMs: number;
	/** Stop polling this long after the start. */
	readonly maxDurationMs: number;
	readonly onResult: (result: T) => void;
	/** Called when a fetch fails, except when polling was stopped. */
	readonly onError?: (error: unknown) => void;
}

/**
 * Fetch now and then every `intervalMs`, skipping turns while the page is
 * hidden, until `maxDurationMs` has passed or the returned function is called.
 */
export function poll<T>(
	fetchOnce: (signal: AbortSignal) => Promise<T>,
	{ intervalMs, maxDurationMs, onResult, onError }: PollOptions<T>
): () => void {
	const controller = new AbortController();
	const startedAt = Date.now();
	let timer: ReturnType<typeof setTimeout> | undefined;

	const refresh = async () => {
		if (document.visibilityState === 'visible') {
			try {
				onResult(await fetchOnce(controller.signal));
			} catch (error) {
				if (controller.signal.aborted) return;
				onError?.(error);
			}
		}
		if (!controller.signal.aborted && Date.now() - startedAt < maxDurationMs) {
			timer = setTimeout(refresh, intervalMs);
		}
	};

	void refresh();
	return () => {
		controller.abort();
		clearTimeout(timer);
	};
}
