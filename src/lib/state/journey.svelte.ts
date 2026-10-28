import { getContext, setContext } from 'svelte';
import {
	castVote,
	reportArrival,
	returnPersona,
	submitRanking,
	takePersona
} from '$lib/api/client';
import type { ParticipantVote } from '$lib/api/contracts';
import { INTERVIEW_SLOTS, RANKED_THERMOMETERS, RANKING_ROUNDS } from '$lib/config';
import { COLOURS, DISPLAY_PALETTE, findColour } from '$lib/data/colours';
import { findPersona, PERSONAS } from '$lib/data/personas';
import { personasOfBlock, sameBlock, type Block } from '$lib/domain/blocks';
import { buildPairs, rankFromChoices, type Pair, type PairChoice } from '$lib/domain/pairwise';
import {
	buildScenario,
	mostTellingAlternatives,
	whatIf,
	type Alternatives,
	type Scenario,
	type WhatIfChange,
	type WhatIfResult
} from '$lib/domain/scenario';
import {
	COLOUR_IDS,
	isRuleId,
	isVoteChoice,
	PATH_CHOICES,
	THERMOMETER_IDS,
	TWO_WAYS_POLL
} from '$lib/domain/types';
import type {
	ColourId,
	Locale,
	Mode,
	ParticipantEventKind,
	PathChoice,
	RuleId,
	ThermometerId,
	VoteChoice
} from '$lib/domain/types';
import { seededRandom } from '$lib/utils/random';
import { isUuid, randomUuid } from '$lib/utils/uuid';
import { eventOutbox } from './eventOutbox';
import { requirementsOf, STEPS_BY_MODE, type Requirement, type Step } from './steps';

/**
 * Seed for the other applicants' colours: the same on every device, and picked
 * for a natural-looking mix (uneven counts, no long runs of one colour).
 */
const POOL_COLOUR_SEED = 7;

type ThermometerPair = Pair<ThermometerId>;
type ThermometerChoice = PairChoice<ThermometerId>;
type Votes = Partial<Record<RuleId, VoteChoice>>;

/** The attribute changed on the "would it go differently if you were different?" screen. */
export const WHAT_IF_ATTRIBUTES = ['colour', 'shape', 'size'] as const;
export type WhatIfAttribute = (typeof WHAT_IF_ATTRIBUTES)[number];

/** The change to your CV when you pick `attribute`. */
export function whatIfChange(alternatives: Alternatives, attribute: WhatIfAttribute): WhatIfChange {
	switch (attribute) {
		case 'colour':
			return { colour: alternatives.colour };
		case 'shape':
			return { shape: alternatives.shape };
		case 'size':
			return { size: alternatives.size };
	}
}

/**
 * What survives a page refresh (sessionStorage). Bump the version on breaking
 * changes. The optional fields were added during version 3, so older snapshots
 * may lack them.
 */
interface Snapshot {
	readonly version: 3;
	readonly participantId?: string;
	readonly step: number;
	readonly personaId: string | null;
	readonly colourId: ColourId | null;
	readonly cvSubmitted: boolean;
	readonly verdictSeen: boolean;
	readonly blindSpotSeen?: boolean;
	readonly whatIf: WhatIfAttribute | null;
	readonly pairs: readonly ThermometerPair[];
	readonly choices: readonly ThermometerChoice[];
	readonly rankingSubmitted: boolean;
	readonly votes?: Votes;
	readonly path?: PathChoice | null;
}

/** Each mode keeps its own progress, so a participant can try one without losing the other. */
const STORAGE_KEYS: Readonly<Record<Mode, string>> = {
	workshop: 'fairness-demo:journey',
	solo: 'fairness-demo:journey:solo'
};

/**
 * The participant's progress through the demo. One instance per page, shared
 * with every screen through context.
 */
export class Journey {
	readonly mode: Mode;
	readonly steps: readonly Step[];
	/** Anonymous id of this participant's run through the demo; a restart gets a new one. */
	participantId = randomUuid();
	step = $state(0);
	personaId = $state<string | null>(null);
	colourId = $state<ColourId | null>(null);
	cvSubmitted = $state(false);
	/** Whether the box has played out its verdict (the ranking) for the current score. */
	verdictSeen = $state(false);
	/** Whether the crowd on "het hoekje waar niemand keek" has been stepped through to the end. */
	blindSpotSeen = $state(false);
	whatIf = $state<WhatIfAttribute | null>(null);
	/** Questions of the ranking screen; `choices[i]` answers `pairs[i]`. */
	pairs = $state<ThermometerPair[]>([]);
	choices = $state<ThermometerChoice[]>([]);
	rankingSubmitted = $state(false);
	claimingPersona = $state(false);
	/** Solo version: the answer given on each round's vote screen. */
	votes = $state<Votes>({});
	/** Solo version: the way forward chosen on "Twee manieren vooruit". */
	path = $state<PathChoice | null>(null);

	readonly persona = $derived(findPersona(this.personaId));
	readonly colour = $derived(findColour(this.colourId));
	readonly scenario: Scenario | null = $derived(
		this.persona && this.colour
			? buildScenario({
					personas: PERSONAS,
					persona: this.persona,
					colour: this.colour,
					palette: DISPLAY_PALETTE,
					random: seededRandom(POOL_COLOUR_SEED),
					slots: INTERVIEW_SLOTS
				})
			: null
	);
	/** The changes offered on the "what if you were different?" screen. */
	readonly alternatives: Alternatives | null = $derived(
		this.scenario ? mostTellingAlternatives(this.scenario, COLOURS) : null
	);
	/** Your changed CV's verdict, once it has been through the box. */
	readonly whatIfResult: WhatIfResult | null = $derived(
		this.scenario && this.alternatives && this.whatIf
			? whatIf(this.scenario, whatIfChange(this.alternatives, this.whatIf))
			: null
	);
	readonly ranking = $derived(rankFromChoices(RANKED_THERMOMETERS, this.choices));

	constructor(mode: Mode) {
		this.mode = mode;
		this.steps = STEPS_BY_MODE[mode];
	}

	/* ---------------------------------------------------------------- */
	/* Navigation                                                        */
	/* ---------------------------------------------------------------- */

	get current(): Step {
		return this.steps[this.step] ?? this.steps[0]!;
	}

	get isFirst(): boolean {
		return this.step === 0;
	}

	next(): void {
		this.goTo(this.step + 1);
	}

	back(): void {
		this.goTo(this.step - 1);
	}

	/** Go to a step, but never past a step whose requirements are not met yet. */
	goTo(index: number): void {
		this.step = this.clamp(index);
	}

	clamp(index: number): number {
		const target = Math.min(Math.max(0, Math.trunc(index)), this.steps.length - 1);
		for (let i = 0; i <= target; i++) {
			if (requirementsOf(this.steps, i).some((r) => !this.#meets(r))) return Math.max(0, i - 1);
		}
		return target;
	}

	#meets(requirement: Requirement): boolean {
		switch (requirement) {
			case 'persona':
				return this.persona !== undefined;
			case 'colour':
				return this.colour !== undefined;
			case 'score':
				return this.cvSubmitted;
		}
	}

	/* ---------------------------------------------------------------- */
	/* Actions                                                           */
	/* ---------------------------------------------------------------- */

	/**
	 * Take on a persona of the block the participant got at the table: one of
	 * that block nobody else is playing (the server's persona box), or a random
	 * one of the block when offline, so the demo never gets stuck. Keeps the
	 * current persona if it already matches the block.
	 */
	async chooseBlock(block: Block): Promise<void> {
		if (this.claimingPersona || (this.persona && sameBlock(this.persona, block))) return;
		this.claimingPersona = true;
		let personaId: string;
		try {
			const response = await takePersona({ participantId: this.participantId, ...block });
			const persona = findPersona(response.personaId);
			personaId = persona && sameBlock(persona, block) ? persona.id : randomPersonaId(block);
		} catch (error) {
			console.warn('[journey] Persona service unreachable, using a random persona.', error);
			personaId = randomPersonaId(block);
		} finally {
			this.claimingPersona = false;
		}
		this.personaId = personaId;
		this.#forgetScore();
	}

	/**
	 * Solo version: there is no block to take, so the app hands out a persona
	 * itself, at random. Keeps the persona once there is one.
	 */
	assignPersona(): void {
		if (this.persona) return;
		const persona = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
		if (!persona) throw new Error('The persona list is empty');
		this.personaId = persona.id;
		this.#forgetScore();
	}

	chooseColour(colourId: ColourId): void {
		if (colourId === this.colourId) return;
		this.colourId = colourId;
		this.#forgetScore();
	}

	/** A different persona or colour means a different score: the CV has to go into the box again. */
	#forgetScore(): void {
		this.cvSubmitted = false;
		this.verdictSeen = false;
		this.blindSpotSeen = false;
		this.whatIf = null;
	}

	submitCv(): void {
		this.cvSubmitted = true;
	}

	markVerdictSeen(): void {
		this.verdictSeen = true;
	}

	markBlindSpotSeen(): void {
		this.blindSpotSeen = true;
	}

	/** Questions for the ranking screen, created once per participant. */
	ensurePairs(): void {
		if (this.pairs.length === 0) {
			this.pairs = buildPairs(RANKED_THERMOMETERS, { rounds: RANKING_ROUNDS });
		}
	}

	/** Answer the current ranking question. */
	choose(winner: ThermometerId): void {
		const pair = this.pairs[this.choices.length];
		if (pair) this.choices = [...this.choices, { ...pair, winner }];
	}

	undoLastChoice(): void {
		this.choices = this.choices.slice(0, -1);
	}

	/** Store the ranking once; failures are logged but never block the participant. */
	async submitRanking(locale: Locale): Promise<void> {
		if (this.rankingSubmitted || !this.personaId) return;
		this.rankingSubmitted = true;
		try {
			await submitRanking({
				personaId: this.personaId,
				locale,
				ranking: this.ranking.map((r) => r.item),
				choices: this.choices
			});
		} catch (error) {
			console.warn('[journey] Could not store the ranking.', error);
		}
	}

	/**
	 * Solo version: vote on `rule` in the app. Its results show the vote as this
	 * participant's persona. Best effort: failures are logged, and voting again
	 * in the same round changes the vote.
	 */
	async vote(rule: RuleId, choice: VoteChoice): Promise<void> {
		this.votes = { ...this.votes, [rule]: choice };
		const voter = this.#voter();
		if (voter) await this.#cast({ ...voter, rule, choice });
	}

	/** Solo version: choose a way forward on "Twee manieren vooruit", stored like a vote. */
	async choosePath(path: PathChoice): Promise<void> {
		this.path = path;
		const voter = this.#voter();
		if (voter) await this.#cast({ ...voter, rule: TWO_WAYS_POLL, choice: path });
	}

	#voter() {
		if (!this.personaId || !this.colourId) return null;
		return {
			participantId: this.participantId,
			personaId: this.personaId,
			colourId: this.colourId
		};
	}

	/** Store a vote cast in the app. Best effort: failures are logged, never shown. */
	async #cast(vote: ParticipantVote): Promise<void> {
		try {
			await castVote(vote);
		} catch (error) {
			console.warn('[journey] Could not store the vote.', error);
		}
	}

	/**
	 * Tell the server this participant reached the vote screen of `rule`, so the
	 * results can show their tablet vote as their persona. Best effort: failures
	 * are logged, and the server keeps only the first arrival per round. Solo
	 * participants vote in the app, and their votes know who cast them.
	 */
	async arriveAtVote(rule: RuleId): Promise<void> {
		if (this.mode !== 'workshop' || !this.personaId || !this.colourId) return;
		try {
			await reportArrival({
				participantId: this.participantId,
				rule,
				personaId: this.personaId,
				colourId: this.colourId
			});
		} catch (error) {
			console.warn('[journey] Could not report the arrival.', error);
		}
	}

	/**
	 * The participant hands back their block: their persona goes back in the
	 * server's persona box for the next participant with that block. Best
	 * effort, and harmless to repeat. Solo participants never took one out.
	 */
	async returnPersona(): Promise<void> {
		if (this.mode !== 'workshop' || !this.personaId) return;
		try {
			await returnPersona({ participantId: this.participantId });
		} catch (error) {
			console.warn('[journey] Could not return the persona.', error);
		}
	}

	/** Note a moment of this participant's run for the analysis after the event; never fails. */
	track(kind: ParticipantEventKind): void {
		eventOutbox()?.log(this.participantId, kind);
	}

	/** Start over as a new participant, who takes a new block. */
	reset(): void {
		// Reads the finished participant's id right away, before it is replaced below.
		void this.returnPersona();
		this.participantId = randomUuid();
		this.track('opened');
		this.step = 0;
		this.personaId = null;
		this.colourId = null;
		this.cvSubmitted = false;
		this.verdictSeen = false;
		this.blindSpotSeen = false;
		this.whatIf = null;
		this.pairs = [];
		this.choices = [];
		this.rankingSubmitted = false;
		this.votes = {};
		this.path = null;
	}

	/* ---------------------------------------------------------------- */
	/* Persistence                                                       */
	/* ---------------------------------------------------------------- */

	snapshot(): Snapshot {
		return {
			version: 3,
			participantId: this.participantId,
			step: this.step,
			personaId: this.personaId,
			colourId: this.colourId,
			cvSubmitted: this.cvSubmitted,
			verdictSeen: this.verdictSeen,
			blindSpotSeen: this.blindSpotSeen,
			whatIf: this.whatIf,
			pairs: this.pairs,
			choices: this.choices,
			rankingSubmitted: this.rankingSubmitted,
			votes: this.votes,
			path: this.path
		};
	}

	/** Restore a snapshot, ignoring anything that does not look valid. Returns whether it did. */
	restore(raw: unknown): boolean {
		if (!isSnapshot(raw)) return false;
		if (raw.participantId) this.participantId = raw.participantId;
		this.personaId = findPersona(raw.personaId) ? raw.personaId : null;
		this.colourId = raw.colourId;
		this.cvSubmitted = raw.cvSubmitted;
		this.verdictSeen = raw.verdictSeen;
		this.blindSpotSeen = raw.blindSpotSeen ?? false;
		this.whatIf = raw.whatIf;
		this.pairs = [...raw.pairs];
		this.choices = raw.choices.slice(0, raw.pairs.length);
		this.rankingSubmitted = raw.rankingSubmitted;
		this.votes = { ...raw.votes };
		this.path = raw.path ?? null;
		this.goTo(raw.step);
		return true;
	}

	save(storage: Storage | undefined = safeSessionStorage()): void {
		try {
			storage?.setItem(STORAGE_KEYS[this.mode], JSON.stringify(this.snapshot()));
		} catch {
			// Private mode or full storage: progress just won't survive a refresh.
		}
	}

	/** Pick up a run interrupted by a refresh. Returns whether there was one. */
	load(storage: Storage | undefined = safeSessionStorage()): boolean {
		try {
			const raw = storage?.getItem(STORAGE_KEYS[this.mode]);
			return raw ? this.restore(JSON.parse(raw)) : false;
		} catch {
			// Corrupt or inaccessible storage: start fresh.
			return false;
		}
	}
}

function randomPersonaId(block: Block): string {
	const candidates = personasOfBlock(PERSONAS, block);
	const persona = candidates[Math.floor(Math.random() * candidates.length)];
	if (!persona) throw new Error(`No persona is a ${block.size} ${block.shape}`);
	return persona.id;
}

function safeSessionStorage(): Storage | undefined {
	try {
		return typeof window === 'undefined' ? undefined : window.sessionStorage;
	} catch {
		return undefined;
	}
}

const isThermometer = (value: unknown): value is ThermometerId =>
	(THERMOMETER_IDS as readonly unknown[]).includes(value);

const isPair = (value: unknown): value is ThermometerPair =>
	typeof value === 'object' &&
	value !== null &&
	isThermometer((value as ThermometerPair).left) &&
	isThermometer((value as ThermometerPair).right);

const isChoice = (value: unknown): value is ThermometerChoice =>
	isPair(value) && isThermometer((value as ThermometerChoice).winner);

const isVotes = (value: unknown): value is Votes =>
	typeof value === 'object' &&
	value !== null &&
	!Array.isArray(value) &&
	Object.entries(value).every(([rule, choice]) => isRuleId(rule) && isVoteChoice(choice));

function isSnapshot(value: unknown): value is Snapshot {
	if (typeof value !== 'object' || value === null) return false;
	const s = value as Record<string, unknown>;
	return (
		s.version === 3 &&
		(s.participantId === undefined || isUuid(s.participantId)) &&
		typeof s.step === 'number' &&
		(s.personaId === null || typeof s.personaId === 'string') &&
		(s.colourId === null || (COLOUR_IDS as readonly unknown[]).includes(s.colourId)) &&
		typeof s.cvSubmitted === 'boolean' &&
		typeof s.verdictSeen === 'boolean' &&
		(s.blindSpotSeen === undefined || typeof s.blindSpotSeen === 'boolean') &&
		(s.whatIf === null || (WHAT_IF_ATTRIBUTES as readonly unknown[]).includes(s.whatIf)) &&
		Array.isArray(s.pairs) &&
		s.pairs.every(isPair) &&
		Array.isArray(s.choices) &&
		s.choices.every(isChoice) &&
		typeof s.rankingSubmitted === 'boolean' &&
		(s.votes === undefined || isVotes(s.votes)) &&
		(s.path === undefined ||
			s.path === null ||
			(PATH_CHOICES as readonly unknown[]).includes(s.path))
	);
}

const KEY = Symbol('journey');

export function setJourney(journey: Journey): Journey {
	return setContext(KEY, journey);
}

export function getJourney(): Journey {
	const journey = getContext<Journey | undefined>(KEY);
	if (!journey) throw new Error('getJourney() must be called inside the demo page');
	return journey;
}
