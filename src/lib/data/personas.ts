import type { Candidate, Persona, Size } from '$lib/domain/types';

/**
 * The pre-existing persona list, transcribed from `fairness-workshop-ds.xlsx`
 * (sheet "Blad1", block "hesje met attributen bij geboorte"), in spreadsheet order.
 *
 * - `shape` / `size`: attributes you are "born" with (vorm / grootte)
 * - `baseScore`: the score the algorithm gives, before the chosen colour is added
 * - `qualified`: the "qualifier" column (hidden ground truth)
 *
 * Nobody in the list is medium-sized, so no participant ever gets that size.
 * The spreadsheet's medium personas were made large or small along the bias
 * the box already has: it overrates large CVs (the high but unqualified scores
 * became large) and underrates small ones (the low scores became small).
 * Their `crowdSize` keeps the spreadsheet's medium for their look-alikes in
 * the blind-spot crowd, where shape and size cross and the medium-sized belong
 * in the picture; the persona itself keeps its size there too.
 * One exception: p01, the box's best-scored triangle while unsuitable, is
 * exactly the large CV it overrates, so it stays large in the crowd too. As a
 * medium it would make the large triangles look overlooked, against the bias.
 *
 * The order the persona box prefers them in is derived in `domain/handOutOrder.ts`,
 * so rows can be edited or added here without touching anything else.
 */
// prettier-ignore
export const PERSONAS: readonly Persona[] = [
	{ id: 'p01', shape: 'triangle', size: 'large',                      baseScore: 75, qualified: false },
	{ id: 'p02', shape: 'triangle', size: 'large',                      baseScore: 64, qualified: true },
	{ id: 'p03', shape: 'circle',   size: 'large',                      baseScore: 14, qualified: false },
	{ id: 'p04', shape: 'circle',   size: 'large',                      baseScore: 34, qualified: true },
	{ id: 'p05', shape: 'circle',   size: 'small', crowdSize: 'medium', baseScore: 25, qualified: true },
	{ id: 'p06', shape: 'circle',   size: 'small',                      baseScore: 18, qualified: false },
	{ id: 'p07', shape: 'square',   size: 'large',                      baseScore: 55, qualified: true },
	{ id: 'p08', shape: 'square',   size: 'large',                      baseScore: 90, qualified: true },
	{ id: 'p09', shape: 'square',   size: 'large',                      baseScore: 82, qualified: true },
	{ id: 'p10', shape: 'square',   size: 'large',                      baseScore: 73, qualified: true },
	{ id: 'p11', shape: 'triangle', size: 'small',                      baseScore: 56, qualified: true },
	{ id: 'p12', shape: 'triangle', size: 'small',                      baseScore: 32, qualified: false },
	{ id: 'p13', shape: 'triangle', size: 'large',                      baseScore: 38, qualified: true },
	{ id: 'p14', shape: 'square',   size: 'small',                      baseScore: 80, qualified: true },
	{ id: 'p15', shape: 'square',   size: 'small',                      baseScore: 68, qualified: true },
	{ id: 'p16', shape: 'square',   size: 'small',                      baseScore: 39, qualified: true },
	{ id: 'p17', shape: 'square',   size: 'small', crowdSize: 'medium', baseScore: 36, qualified: false },
	{ id: 'p18', shape: 'square',   size: 'small', crowdSize: 'medium', baseScore: 52, qualified: false },
	{ id: 'p19', shape: 'square',   size: 'large', crowdSize: 'medium', baseScore: 88, qualified: false },
	{ id: 'p20', shape: 'triangle', size: 'small',                      baseScore: 89, qualified: true }
];

const personasById = new Map(PERSONAS.map((persona) => [persona.id, persona]));

export function findPersona(id: string | null | undefined): Persona | undefined {
	return id ? personasById.get(id) : undefined;
}

/** An applicant's size in the blind-spot crowd (applicants carry their persona's id). */
export function crowdSizeOf(applicant: Candidate): Size {
	return findPersona(applicant.id)?.crowdSize ?? applicant.size;
}
