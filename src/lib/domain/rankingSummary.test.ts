import { describe, expect, it } from 'vitest';
import { rankFromChoices } from './pairwise';
import { addRanking, emptyRankingSummary, summariseRankings } from './rankingSummary';
import { THERMOMETER_IDS, type ThermometerId } from './types';

const [counterfactual, parity, opportunity] = THERMOMETER_IDS;

/** A ranking where `order[0]` beat both others and `order[1]` beat the last one. */
const ranked = (...order: ThermometerId[]) =>
	rankFromChoices(THERMOMETER_IDS, [
		{ left: order[0]!, right: order[1]!, winner: order[0]! },
		{ left: order[0]!, right: order[2]!, winner: order[0]! },
		{ left: order[1]!, right: order[2]!, winner: order[1]! }
	]);

describe('summariseRankings', () => {
	it('counts first and second places, most often first on top', () => {
		const summary = summariseRankings(THERMOMETER_IDS, [
			ranked(parity, counterfactual, opportunity),
			ranked(parity, opportunity, counterfactual),
			ranked(opportunity, parity, counterfactual)
		]);
		expect(summary).toEqual({
			total: 3,
			tallies: [
				{ thermometer: parity, first: 2, second: 1 },
				{ thermometer: opportunity, first: 1, second: 1 },
				{ thermometer: counterfactual, first: 0, second: 1 }
			]
		});
	});

	it('counts a shared place for every thermometer sharing it', () => {
		const tie = rankFromChoices(THERMOMETER_IDS, [
			{ left: counterfactual, right: parity, winner: counterfactual },
			{ left: parity, right: opportunity, winner: parity },
			{ left: opportunity, right: counterfactual, winner: opportunity }
		]);
		const summary = summariseRankings(THERMOMETER_IDS, [tie]);
		expect(summary.tallies.every((tally) => tally.first === 1 && tally.second === 0)).toBe(true);
	});

	it('breaks ties by thermometer number, whatever order the rankings came in', () => {
		const a = ranked(opportunity, counterfactual, parity);
		const b = ranked(counterfactual, opportunity, parity);
		const order = (summary: ReturnType<typeof summariseRankings>) =>
			summary.tallies.map((tally) => tally.thermometer);
		expect(order(summariseRankings(THERMOMETER_IDS, [a, b]))).toEqual([
			counterfactual,
			opportunity,
			parity
		]);
		expect(order(summariseRankings(THERMOMETER_IDS, [b, a]))).toEqual(
			order(summariseRankings(THERMOMETER_IDS, [a, b]))
		);
	});
});

describe('addRanking', () => {
	it('leaves the summary it was given untouched', () => {
		const empty = emptyRankingSummary(THERMOMETER_IDS);
		addRanking(empty, ranked(parity, counterfactual, opportunity));
		expect(empty.total).toBe(0);
		expect(empty.tallies.every((tally) => tally.first === 0)).toBe(true);
	});
});
