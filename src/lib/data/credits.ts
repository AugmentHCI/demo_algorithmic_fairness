import type { Locale } from '$lib/domain/types';

/**
 * The research groups behind the demo, credited on the closing screen. Names
 * are proper nouns, so they are the same in every language.
 */
export interface ResearchGroup {
	readonly name: string;
	/** University or institute, shown below the name. */
	readonly affiliation: string;
	/** Logo in `static/`, shown instead of the name; the name becomes its alt text. */
	readonly logo?: string;
}

export const RESEARCH_GROUPS: readonly ResearchGroup[] = [
	{ name: 'SMIT', affiliation: 'VUB · imec', logo: '/logos/smit.png' },
	{ name: 'Augment', affiliation: 'KU Leuven · imec', logo: '/logos/augment.png' }
];

export interface InfoPdf {
	/** The file in `static/`, so it is served from the site root. */
	readonly path: string;
	/** The name the downloaded file gets on the participant's phone. */
	readonly fileName: string;
}

/**
 * Everything the demo explains, to take home as a PDF from the closing screen,
 * in the language the participant did the demo in.
 */
export const INFO_PDF: Readonly<Record<Locale, InfoPdf>> = {
	nl: { path: '/fairness-demo-uitleg.pdf', fileName: 'demo-algo-fairness-leaflet.pdf' },
	en: { path: '/fairness-demo-leaflet.pdf', fileName: 'demo-algo-fairness-leaflet-en.pdf' }
};
