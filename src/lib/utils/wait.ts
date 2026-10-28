/** Resolve after `ms`, or reject with an AbortError as soon as `signal` aborts. */
export function wait(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) return reject(signal.reason);
		const timer = setTimeout(() => {
			signal?.removeEventListener('abort', onAbort);
			resolve();
		}, ms);
		const onAbort = () => {
			clearTimeout(timer);
			reject(signal?.reason);
		};
		signal?.addEventListener('abort', onAbort, { once: true });
	});
}
