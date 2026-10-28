/**
 * Votes come from shared tablets and buttons, so they carry no identity. The
 * phones do say when their participant reaches a round's vote screen (an
 * "arrival"): whoever arrived around the time a vote came in most likely cast
 * it. This module pairs votes with arrivals, to show each vote as the shape of
 * the person who probably cast it. It is a best guess, never a record.
 */

interface Timed {
	/** Milliseconds since the epoch. */
	readonly at: number;
}

export interface AttributionWindow {
	/** How long before a vote its voter may have arrived at the vote screen. */
	readonly beforeMs: number;
	/** How long after a vote its voter's arrival may come in (a phone on slow wifi). */
	readonly afterMs: number;
}

/**
 * Pair every vote with the arrival closest to it in time, within `window`.
 * Votes are handled in the order they were cast, and each arrival is used at
 * most once, so one participant never stands for two votes. On a tie the
 * earlier arrival wins: people reach the vote screen before they vote.
 *
 * Returns, per vote and in the order of `votes`, its arrival or `null` when no
 * arrival is left within the window.
 */
export function attributeVotes<Arrival extends Timed>(
	votes: readonly Timed[],
	arrivals: readonly Arrival[],
	window: AttributionWindow
): (Arrival | null)[] {
	const byTime = arrivals.toSorted((a, b) => a.at - b.at);
	const claimed = new Set<number>();
	const result: (Arrival | null)[] = votes.map(() => null);

	const voteOrder = votes.map((_, index) => index).sort((a, b) => votes[a]!.at - votes[b]!.at);
	for (const voteIndex of voteOrder) {
		const vote = votes[voteIndex]!;
		let best = -1;
		let bestDistance = Number.POSITIVE_INFINITY;
		for (let i = 0; i < byTime.length; i++) {
			const arrival = byTime[i]!;
			if (arrival.at > vote.at + window.afterMs) break;
			if (claimed.has(i) || arrival.at < vote.at - window.beforeMs) continue;
			const distance = Math.abs(vote.at - arrival.at);
			// Strictly closer only: on a tie the earlier arrival, found first, stays.
			if (distance < bestDistance) {
				best = i;
				bestDistance = distance;
			}
		}
		if (best !== -1) {
			claimed.add(best);
			result[voteIndex] = byTime[best]!;
		}
	}
	return result;
}

/**
 * Like `attributeVotes`, but a vote nobody arrived near still gets someone:
 * the closest arrival that no vote claimed, however far off in time. These
 * are participants who reached the vote screen and most likely voted too
 * (just later, or with their phone's arrival delayed). A vote is left `null`
 * only when there are more votes than arrivals.
 */
export function attributeEveryVote<Arrival extends Timed>(
	votes: readonly Timed[],
	arrivals: readonly Arrival[],
	window: AttributionWindow
): (Arrival | null)[] {
	const result = attributeVotes(votes, arrivals, window);
	const claimed = new Set(result);
	const leftover = arrivals.filter((arrival) => !claimed.has(arrival));
	const unmatched = result.flatMap((arrival, index) => (arrival ? [] : [index]));
	if (leftover.length === 0 || unmatched.length === 0) return result;

	const anyTime = { beforeMs: Number.POSITIVE_INFINITY, afterMs: Number.POSITIVE_INFINITY };
	const second = attributeVotes(
		unmatched.map((index) => votes[index]!),
		leftover,
		anyTime
	);
	unmatched.forEach((voteIndex, i) => (result[voteIndex] = second[i] ?? null));
	return result;
}

/**
 * A stand-in for the voter of the `index`-th vote when there is nobody left to
 * pair it with: one of `options`, spread over the votes. The same index
 * always gets the same one, so the picture doesn't reshuffle on every refresh.
 */
export function guessVoter<T>(index: number, options: readonly T[]): T {
	if (options.length === 0) throw new RangeError('guessVoter needs at least one option');
	// Knuth's multiplicative hash: neighbouring votes get unrelated options.
	const hash = Math.imul(index + 1, 2_654_435_761) >>> 0;
	return options[hash % options.length]!;
}
