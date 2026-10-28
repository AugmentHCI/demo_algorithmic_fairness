/**
 * A crowd made from the applicant pool: every applicant stands for several
 * people with the same shape and outcome, and the same size unless the crowd
 * gives them another one. Every share invited per shape stays exactly what it
 * was, so the crowd tells the same story at a larger scale. The participant
 * only fills in their persona's spot, so the crowd holds the same number of
 * each shape and size for everyone.
 */
import type { Candidate, Size } from './types';

export interface Crowd {
	readonly pool: readonly Candidate[];
	readonly invitedIds: ReadonlySet<string>;
}

export interface CrowdOptions {
	/** How many people each applicant stands for. */
	readonly factor: number;
	/** Display colours for the look-alikes. */
	readonly palette: readonly string[];
	/** Source of randomness for the look-alikes' colours, in [0, 1). */
	readonly random: () => number;
	/**
	 * The size an applicant's look-alikes have in the crowd; their own size by
	 * default. The applicant itself always keeps its size: it is a real persona
	 * (perhaps you), and no real persona is medium-sized.
	 */
	readonly sizeOf?: (applicant: Candidate) => Size;
}

/**
 * Each applicant, followed by `factor − 1` look-alikes. The look-alikes get
 * their own id and a colour from `palette`; only the original can be you.
 */
export function multiplyPool(
	pool: readonly Candidate[],
	invitedIds: ReadonlySet<string>,
	{ factor, palette, random, sizeOf = (applicant) => applicant.size }: CrowdOptions
): Crowd {
	if (!Number.isInteger(factor) || factor < 1) throw new Error(`Invalid crowd factor ${factor}`);
	if (palette.length === 0) throw new Error('The display palette is empty');

	const crowd: Candidate[] = [];
	const invited = new Set<string>();
	for (const applicant of pool) {
		const size = sizeOf(applicant);
		const lookAlikes = Array.from({ length: factor - 1 }, (_, i): Candidate => ({
			...applicant,
			size,
			id: `${applicant.id}~${i + 1}`,
			colour: palette[Math.floor(random() * palette.length)] as string,
			isYou: false
		}));
		const people = [applicant, ...lookAlikes];
		crowd.push(...people);
		if (invitedIds.has(applicant.id)) for (const person of people) invited.add(person.id);
	}
	return { pool: crowd, invitedIds: invited };
}
