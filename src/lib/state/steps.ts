import { LANGUAGE_CHOICE_ENABLED } from '$lib/config';
import { RULE_IDS, type Mode, type RuleId } from '$lib/domain/types';

/** Plain story/interaction screens. */
type SimpleStepKind =
	| 'language'
	| 'world'
	| 'identity'
	| 'colour'
	| 'applicants'
	| 'algorithm'
	| 'blackBox'
	| 'preview'
	| 'score'
	| 'unaware'
	| 'headInSand'
	| 'thermometers'
	| 'tradeOff'
	| 'reveal'
	| 'ranking'
	| 'intersection'
	| 'blindSpot'
	| 'equity'
	| 'history'
	| 'repair'
	| 'twoWays'
	| 'thanks';

/** Each round: the rule's screen, voting on it at the table, then everyone's votes. */
type RoundStepKind = 'rule' | 'vote' | 'results';

export type Step =
	{ readonly kind: SimpleStepKind } | { readonly kind: RoundStepKind; readonly rule: RuleId };

export type StepKind = Step['kind'];

/** The story, in the order of the design. Each rule is voted on, then shows its results. */
const STORY: readonly Step[] = [
	{ kind: 'world' },
	{ kind: 'applicants' },
	{ kind: 'blackBox' },
	{ kind: 'algorithm' },
	{ kind: 'preview' },
	{ kind: 'identity' },
	{ kind: 'colour' },
	{ kind: 'score' },
	{ kind: 'unaware' },
	{ kind: 'headInSand' },
	{ kind: 'thermometers' },
	{ kind: 'tradeOff' },
	...RULE_IDS.flatMap((rule): Step[] => [
		{ kind: 'rule', rule },
		{ kind: 'vote', rule },
		{ kind: 'results', rule }
	]),
	{ kind: 'reveal' },
	{ kind: 'ranking' },
	{ kind: 'intersection' },
	{ kind: 'blindSpot' },
	{ kind: 'equity' },
	{ kind: 'history' },
	{ kind: 'repair' },
	{ kind: 'twoWays' },
	{ kind: 'thanks' }
];

/**
 * The whole journey per mode. The solo version has no language screen: its
 * participants pick a language on the start page, or with the switch.
 */
export const STEPS_BY_MODE: Readonly<Record<Mode, readonly Step[]>> = {
	workshop: LANGUAGE_CHOICE_ENABLED ? [{ kind: 'language' }, ...STORY] : STORY,
	solo: STORY
};

/* ------------------------------------------------------------------------- */
/* Chapter progress: the dashes at the top of the screen.                    */
/* ------------------------------------------------------------------------- */

export interface ChapterProgress {
	/** 1-based position within the chapter. */
	readonly current: number;
	readonly total: number;
}

/** The introduction: its dashes show on these screens (the character creation has none). */
const INTRO_CHAPTER: readonly StepKind[] = [
	'world',
	'applicants',
	'blackBox',
	'algorithm',
	'preview',
	'score'
];

/** The epilogue after the ranking: beyond fair sorting, towards repair. */
const EPILOGUE_CHAPTER: readonly StepKind[] = [
	'intersection',
	'blindSpot',
	'equity',
	'history',
	'repair',
	'twoWays'
];

export function chapterProgressOf(step: Step): ChapterProgress | null {
	if ('rule' in step) {
		return { current: RULE_IDS.indexOf(step.rule) + 1, total: RULE_IDS.length };
	}
	for (const chapter of [INTRO_CHAPTER, EPILOGUE_CHAPTER]) {
		const index = chapter.indexOf(step.kind);
		if (index !== -1) return { current: index + 1, total: chapter.length };
	}
	return null;
}

/* ------------------------------------------------------------------------- */
/* Requirements: what must be known before a step can be shown.              */
/* ------------------------------------------------------------------------- */

export type Requirement = 'persona' | 'colour' | 'score';

function indexOfStep(steps: readonly Step[], kind: SimpleStepKind): number {
	const index = steps.findIndex((step) => step.kind === kind);
	if (index === -1) throw new Error(`The journey has no '${kind}' step`);
	return index;
}

/** What the screen at `index` of `steps` needs to be shown. */
export function requirementsOf(steps: readonly Step[], index: number): readonly Requirement[] {
	// The identity screen is where the participant gets their persona, so it needs none yet.
	if (index > indexOfStep(steps, 'score')) return ['persona', 'colour', 'score'];
	if (index > indexOfStep(steps, 'colour')) return ['persona', 'colour'];
	if (index > indexOfStep(steps, 'identity')) return ['persona'];
	return [];
}
