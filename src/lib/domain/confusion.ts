/**
 * The confusion matrix behind thermometer 3 ("even vaak gevonden"): the box's
 * choice (invited or not) set against the ground truth (suitable or not).
 */
import { rankPool } from './candidates';
import type { Candidate } from './types';

export const CONFUSION_CELLS = [
	'truePositive',
	'falseNegative',
	'falsePositive',
	'trueNegative'
] as const;
export type ConfusionCell = (typeof CONFUSION_CELLS)[number];

export function confusionCellOf(qualified: boolean, invited: boolean): ConfusionCell {
	if (qualified) return invited ? 'truePositive' : 'falseNegative';
	return invited ? 'falsePositive' : 'trueNegative';
}

/** Whether the box got this cell right. */
export function isCorrect(cell: ConfusionCell): boolean {
	return cell === 'truePositive' || cell === 'trueNegative';
}

/** The candidates in each cell, in ranking order. */
export function confusionMatrix(
	pool: readonly Candidate[],
	invitedIds: ReadonlySet<string>
): Record<ConfusionCell, Candidate[]> {
	const matrix: Record<ConfusionCell, Candidate[]> = {
		truePositive: [],
		falseNegative: [],
		falsePositive: [],
		trueNegative: []
	};
	for (const candidate of rankPool(pool)) {
		matrix[confusionCellOf(candidate.qualified, invitedIds.has(candidate.id))].push(candidate);
	}
	return matrix;
}
