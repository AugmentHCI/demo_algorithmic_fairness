import {
	buildPool,
	clampScore,
	counterfactualBaseScore,
	rankOf,
	scoreDistributions,
	type ScoreDistributions
} from './candidates';
import { selectCandidates } from './rules';
import type { Candidate, Colour, Persona, SelectionRule, Shape, Size } from './types';
import { SHAPES, SIZES } from './types';

const SELECTION_RULES: readonly SelectionRule[] = ['bare_box', 'parity', 'opportunity'];

export interface RuleOutcome {
	readonly invitedIds: ReadonlySet<string>;
	readonly youInvited: boolean;
	/** Shapes that get more interviews under this rule than under the bare box. */
	readonly shapesGainingInterviews: readonly Shape[];
}

/** Everything the screens need to know about one participant's run through the demo. */
export interface Scenario {
	readonly persona: Persona;
	readonly colour: Colour;
	readonly pool: readonly Candidate[];
	readonly you: Candidate;
	readonly rank: number;
	/** Your rank among the applicants of your own shape, the order "gelijk deel" fills its quotas in. */
	readonly shapeRank: number;
	readonly distributions: ScoreDistributions;
	readonly slots: number;
	readonly outcomes: Readonly<Record<SelectionRule, RuleOutcome>>;
}

export interface ScenarioInput {
	readonly personas: readonly Persona[];
	readonly persona: Persona;
	readonly colour: Colour;
	/** Display colours for the other applicants. */
	readonly palette: readonly string[];
	/** Source of randomness for the other applicants' colours, in [0, 1). */
	readonly random: () => number;
	readonly slots: number;
}

export function buildScenario({
	personas,
	persona,
	colour,
	palette,
	random,
	slots
}: ScenarioInput): Scenario {
	const pool = buildPool(personas, persona, colour, palette, random);
	const you = pool.find((c) => c.isYou);
	if (!you) throw new Error(`Persona ${persona.id} is not part of the persona list`);

	const bareBox = selectCandidates('bare_box', pool, slots);
	const outcomes = Object.fromEntries(
		SELECTION_RULES.map((rule) => {
			const invitedIds = rule === 'bare_box' ? bareBox : selectCandidates(rule, pool, slots);
			const outcome: RuleOutcome = {
				invitedIds,
				youInvited: invitedIds.has(you.id),
				shapesGainingInterviews: SHAPES.filter(
					(shape) => countShape(pool, invitedIds, shape) > countShape(pool, bareBox, shape)
				)
			};
			return [rule, outcome];
		})
	) as Record<SelectionRule, RuleOutcome>;

	return {
		persona,
		colour,
		pool,
		you,
		rank: rankOf(pool, you.id),
		shapeRank: rankOf(
			pool.filter((c) => c.shape === you.shape),
			you.id
		),
		distributions: scoreDistributions(personas),
		slots,
		outcomes
	};
}

function countShape(pool: readonly Candidate[], ids: ReadonlySet<string>, shape: Shape): number {
	return pool.filter((c) => c.shape === shape && ids.has(c.id)).length;
}

/* ------------------------------------------------------------------------- */
/* Thermometer 1: "what if you were different?"                              */
/* ------------------------------------------------------------------------- */

export interface WhatIfChange {
	readonly shape?: Shape;
	readonly size?: Size;
	readonly colour?: Colour;
}

export interface WhatIfResult {
	/** The pool with the participant's CV changed and re-scored by the box. */
	readonly pool: readonly Candidate[];
	readonly score: number;
	readonly rank: number;
	readonly invitedIds: ReadonlySet<string>;
	readonly youInvited: boolean;
}

/** Send a changed CV through the bare box again. */
export function whatIf(scenario: Scenario, change: WhatIfChange): WhatIfResult {
	const { persona, you, distributions, pool, slots } = scenario;
	const colour = change.colour ?? scenario.colour;
	const baseScore = counterfactualBaseScore(persona, change, distributions);
	// Scores are whole numbers, like the ones the box hands out.
	const score = Math.round(clampScore(baseScore + colour.scoreModifier));
	const changedPool = pool.map((c) =>
		c.isYou
			? {
					...c,
					shape: change.shape ?? c.shape,
					size: change.size ?? c.size,
					colour: change.colour?.hex ?? c.colour,
					score
				}
			: c
	);
	const invitedIds = selectCandidates('bare_box', changedPool, slots);
	return {
		pool: changedPool,
		score,
		rank: rankOf(changedPool, you.id),
		invitedIds,
		youInvited: invitedIds.has(you.id)
	};
}

export interface Alternatives {
	readonly shape: Shape;
	readonly size: Size;
	readonly colour: Colour;
}

/**
 * For each attribute, the most telling alternative: preferably one that changes
 * whether you get an interview, otherwise the one that moves your score most.
 */
export function mostTellingAlternatives(
	scenario: Scenario,
	colours: readonly Colour[]
): Alternatives {
	const { you } = scenario;
	const invitedNow = scenario.outcomes.bare_box.youInvited;
	const impact = (change: WhatIfChange): number => {
		const result = whatIf(scenario, change);
		const flips = result.youInvited !== invitedNow ? 1_000 : 0;
		return flips + Math.abs(result.score - you.score);
	};
	const pickMax = <T>(options: readonly T[], toChange: (option: T) => WhatIfChange): T => {
		const [first, ...rest] = options;
		if (first === undefined) throw new Error('No alternatives to choose from');
		return rest.reduce(
			(best, option) => (impact(toChange(option)) > impact(toChange(best)) ? option : best),
			first
		);
	};

	return {
		shape: pickMax(
			SHAPES.filter((s) => s !== you.shape),
			(shape) => ({ shape })
		),
		// Only sizes the box has seen: without scores to compare with, a new size says nothing.
		size: pickMax(
			SIZES.filter((s) => s !== you.size && scenario.distributions.size[s].length > 0),
			(size) => ({ size })
		),
		colour: pickMax(
			colours.filter((c) => c.id !== scenario.colour.id),
			(colour) => ({ colour })
		)
	};
}

/** How a participant's interview outcome changed compared with the bare box. */
export type OutcomeChange = 'nowIn' | 'stillIn' | 'nowOut' | 'stillOut';

export function outcomeChange(invitedBefore: boolean, invitedNow: boolean): OutcomeChange {
	if (invitedNow) return invitedBefore ? 'stillIn' : 'nowIn';
	return invitedBefore ? 'nowOut' : 'stillOut';
}
