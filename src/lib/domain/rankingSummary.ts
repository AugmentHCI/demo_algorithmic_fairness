/**
 * Everyone's answers to "which thermometer must always stay in order?" put
 * together: per thermometer, how many participants placed it first and how
 * many second. A shared place counts for every thermometer sharing it, just as
 * the participant saw it in their own ranking.
 */

import type { RankedItem } from './pairwise';
import { THERMOMETER_IDS, type ThermometerId } from './types';

export interface PlaceTally {
	readonly thermometer: ThermometerId;
	readonly first: number;
	readonly second: number;
}

export interface RankingSummary {
	/** Rankings counted. */
	readonly total: number;
	/** Most often placed first on top; then most often second; then by thermometer number. */
	readonly tallies: readonly PlaceTally[];
}

export function emptyRankingSummary(thermometers: readonly ThermometerId[]): RankingSummary {
	return {
		total: 0,
		tallies: thermometers.map((thermometer) => ({ thermometer, first: 0, second: 0 }))
	};
}

/** The summary with one more ranking counted. Thermometers the summary doesn't know are ignored. */
export function addRanking(
	summary: RankingSummary,
	ranking: readonly RankedItem<ThermometerId>[]
): RankingSummary {
	const positions = new Map(ranking.map(({ item, position }) => [item, position]));
	const counted = summary.tallies.map((tally) => {
		const position = positions.get(tally.thermometer);
		return {
			thermometer: tally.thermometer,
			first: tally.first + (position === 1 ? 1 : 0),
			second: tally.second + (position === 2 ? 1 : 0)
		};
	});
	return { total: summary.total + 1, tallies: counted.sort(byPlaces) };
}

export function summariseRankings(
	thermometers: readonly ThermometerId[],
	rankings: readonly (readonly RankedItem<ThermometerId>[])[]
): RankingSummary {
	return rankings.reduce(addRanking, emptyRankingSummary(thermometers));
}

function byPlaces(a: PlaceTally, b: PlaceTally): number {
	return (
		b.first - a.first ||
		b.second - a.second ||
		THERMOMETER_IDS.indexOf(a.thermometer) - THERMOMETER_IDS.indexOf(b.thermometer)
	);
}
