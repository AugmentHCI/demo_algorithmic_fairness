import type {
	ColourId,
	FenceStage,
	Mode,
	RuleId,
	Shape,
	Size,
	ThermometerId,
	VoteChoice
} from '$lib/domain/types';
import type { ConfusionCell } from '$lib/domain/confusion';
import type { SubgroupSplit } from '$lib/domain/intersections';
import type { OutcomeChange } from '$lib/domain/scenario';

/**
 * Dutch copy (the source language of the design). `en.ts` must provide exactly
 * the same keys: TypeScript enforces this through the `Messages` type.
 * Text between **double asterisks** is rendered bold by <RichText>.
 *
 * A `stand` text says what to do at the workshop's stand; the solo version
 * leaves it out.
 */

const shapeNames: Record<Shape, string> = {
	circle: 'cirkel',
	square: 'vierkant',
	triangle: 'driehoek'
};

const shapeNamesPlural: Record<Shape, string> = {
	circle: 'cirkels',
	square: 'vierkanten',
	triangle: 'driehoeken'
};

const sizeNames: Record<Size, string> = {
	small: 'klein',
	medium: 'middelgroot',
	large: 'groot'
};

/** Dutch adjectives get an -e before "de"-words (een grote driehoek), not before "het"-words (een groot vierkant). */
const isHetWord: Record<Shape, boolean> = { circle: false, square: true, triangle: false };
const inflectedSize: Record<Size, string> = {
	small: 'kleine',
	medium: 'middelgrote',
	large: 'grote'
};

const confusionCellNames: Record<ConfusionCell, string> = {
	truePositive: 'Terecht gekozen',
	falseNegative: 'Gemist',
	falsePositive: 'Onterecht gekozen',
	trueNegative: 'Terecht afgewezen'
};

const numberWords = [
	'nul',
	'één',
	'twee',
	'drie',
	'vier',
	'vijf',
	'zes',
	'zeven',
	'acht',
	'negen',
	'tien'
];
const spell = (n: number) => numberWords[n] ?? String(n);

const ordinal = (n: number) => `${n}e`;

const joinList = (items: readonly string[]) =>
	items.length <= 1
		? (items[0] ?? '')
		: `${items.slice(0, -1).join(', ')} en ${items[items.length - 1]}`;

export const nl = {
	meta: {
		title: 'Is het algoritme eerlijk?',
		description: 'Een interactieve demo over eerlijke algoritmes bij aanwervingen.'
	},
	common: {
		next: 'Verder',
		back: 'Vorige stap',
		progress: (step: number, total: number) => `Stap ${step} van ${total}`,
		switchLanguage: 'Switch to English',
		switchLanguageShort: 'EN',
		you: 'jij',
		or: 'of',
		yourCv: 'jouw cv',
		guideName: 'Pim, je gids',
		showGuide: 'Toon uitleg',
		hideGuide: 'Verberg uitleg',
		guideNew: 'nieuw'
	},
	shapes: shapeNames,
	sizes: sizeNames,
	colours: {
		yellow: 'geel',
		green: 'groen',
		blue: 'blauw',
		red: 'rood'
	} satisfies Record<ColourId, string>,
	describePersona: (size: Size, shape: Shape) =>
		`Een ${isHetWord[shape] ? sizeNames[size] : inflectedSize[size]} ${shapeNames[shape]}`,
	language: {
		title: 'Welke taal wil je gebruiken?',
		choose: 'Nederlands'
	},
	start: {
		title: 'Hoe doe je mee?',
		intro:
			'Welkom! In deze demo ervaar je zelf of een algoritme eerlijk kiest. Je kunt hem alleen doen, of samen met anderen tijdens een workshop.',
		options: {
			solo: {
				title: 'Op mijn eentje',
				body: 'Op je eigen gsm of computer. Alles gebeurt in de app.'
			},
			workshop: {
				title: 'Tijdens een workshop',
				body: 'Aan de stand, met een blokje, stickers en de stemtablets.'
			}
		} satisfies Record<Mode, { title: string; body: string }>
	},
	world: {
		title: 'Welkom in een wereld van vormen.',
		body: 'Hier lopen geen mensen rond. Alleen vormen, in verschillende groottes, al is niet elke vorm en grootte gelijkwaardig in deze wereld.',
		stand: 'Je kreeg net een blokje: dat ben jij.'
	},
	identity: {
		title: 'Welk blokje heb jij?',
		legend: 'Jouw blokje',
		guide: [
			'Neem je blokje erbij en kijk goed.',
			'Welke vorm heeft het? En is het groot of klein? Tik hieronder op hetzelfde blokje.'
		],
		hello: (size: Size, shape: Shape) =>
			`Hallo, ${isHetWord[shape] ? sizeNames[size] : inflectedSize[size]} ${shapeNames[shape]}!`,
		chosen:
			'Je vorm en grootte kies je niet: je kreeg ze, net als je blokje. Ze staan ook op je cv.',
		score: (score: number) => `Het algoritme gaf je een score van **${score}** voor deze job.`,
		cta: 'Dit is mijn blokje',
		ctaDisabled: 'Kies eerst je blokje',
		/** No block to tap: Pim hands out a persona. */
		solo: {
			title: 'Wie ben jij?',
			guide: [
				'In deze wereld kies je je vorm en grootte niet zelf: je krijgt ze.',
				'Ik heb er eentje voor je klaar. Benieuwd?'
			],
			cta: 'Toon wie ik ben'
		}
	},
	colour: {
		title: 'Nu kies jij iets zelf.',
		body: "Je vrienden, je hobby's, je opleiding: dat kies je wel. In deze wereld staat je kleur voor al die eigen keuzes.",
		legend: 'Kies een kleur',
		sticker: 'Neem **jouw kleursticker** en kleef die op je blokje.',
		cta: 'Kies deze kleur',
		ctaDisabled: 'Kies eerst een kleur'
	},
	applicants: {
		title: 'Er zijn honderden sollicitaties. Eentje is van jou.',
		body: 'Een bedrijf zoekt de meest geschikte persoon voor een job, en gebruikt een algoritme om te helpen. Jij bent een van de sollicitanten, dus ook jouw cv zit in de stapel.',
		highlight: 'Ga gerust even op de sollicitatiebank zitten.'
	},
	blackBox: {
		title: 'Maar niemand weet zeker hoe het werkt.',
		body: [
			'We noemen het een ‘**black box**’: je ziet wat erin gaat en wat eruit komt, maar wat ertussen gebeurt, is te ingewikkeld om te volgen.',
			'Het algoritme leerde van oude aanwervingen. En het is niet perfect: het heeft maar in 7 op de 10 gevallen gelijk.'
		],
		cta: 'Waarom gebruiken ze het dan?'
	},
	algorithm: {
		title: "Te veel cv's, te weinig tijd.",
		body: 'Dus gebruikt het bedrijf het toch: het algoritme geeft elke sollicitant een score en rangschikt ze. De makers zeggen dat het enkel naar relevante informatie in je cv kijkt.',
		cta: 'Hoe weten we of dit eerlijk is?'
	},
	preview: {
		title: 'Dat ga jij zelf beleven.',
		body: [
			'In de volgende stappen beleef je een paar manieren om bij te sturen wie er volgens het algoritme op gesprek mag.',
			'Jij zegt telkens of het eerlijk voelt.'
		],
		stand: 'Neem je blokje erbij om te beginnen.',
		cta: 'Ik heb mijn blokje'
	},
	score: {
		title: 'Je cv gaat in het algoritme.',
		dragHint: 'Sleep je cv in het algoritme',
		apply: 'Solliciteer',
		processing: 'Het algoritme rekent…',
		baseLabel: (score: number) => `Score zonder je kleur: ${score}`,
		scoreLabel: (score: number, effect: string) =>
			`Jouw score: ${score}, waarvan ${effect} door je kleur`,
		body: [
			'Dit is de score die het bedrijf voor jouw cv krijgt: een getal van 1 tot 100. Hoe hoger je score, hoe groter je kans op een gesprek.',
			'We leggen ze straks naast die van de anderen.'
		],
		cta: 'Verder'
	},
	unaware: {
		title: 'Makkelijke oplossing: verberg gewoon je vorm?',
		body: [
			'De scores benadelen sommige vormen meer dan andere. Kunnen we het eerlijker maken door de vormen te verbergen?',
			'Als het algoritme je vorm niet ziet, kan het toch niet oneerlijk zijn tegenover driehoeken? Dat klinkt logisch.'
		],
		cta: 'Werkt dat?'
	},
	headInSand: {
		title: 'Niet echt.',
		body: [
			'Het algoritme raadt je vorm toch, uit andere dingen die er vaak mee samengaan. En nu kun je niet eens meer nakijken of je benadeeld wordt door je vorm.',
			'Je ziet het probleem misschien niet meer, maar het is er nog wel.'
		],
		highlight: 'Dit heet **fairness through unawareness**.',
		cta: 'Dus hoe dan wel?'
	},
	thermometers: {
		title: 'Daarom kijken we net wel.',
		body: [
			'Om te weten of het algoritme eerlijk is, moeten we zijn keuzes juist wel naast je vorm leggen.',
			'Daarvoor bestaan tests. Wij noemen ze hier **thermometers**. Er zijn er vandaag meer dan 50. Wij bekijken er drie.'
		],
		cta: 'Moeten we al die testen doen?'
	},
	tradeOff: {
		title: 'En jij zult moeten kiezen.',
		body: 'Welke thermometer het meest telt, hangt af van wat jij belangrijk vindt. Je kunt ze niet allemaal tegelijk gebruiken. Soms spreken ze elkaar tegen.',
		stand: 'Volg de pijl naar het volgende deel van de stand.',
		cta: 'Laat ons beginnen!'
	},
	thermometer: {
		label: (n: number) => `Thermometer ${n}`,
		names: {
			counterfactual: 'je vorm alleen',
			parity: 'gelijk deel',
			opportunity: 'even vaak gevonden'
		} satisfies Record<ThermometerId, string>,
		questions: {
			counterfactual:
				'Krijg je hetzelfde resultaat als je enkel je vorm of je grootte zou veranderen?',
			parity: 'Krijgt elke vorm evenveel interviews?',
			opportunity: 'Vindt het algoritme geschikte mensen even vaak per vorm?'
		} satisfies Record<ThermometerId, string>
	},
	candidates: {
		invited: (count: number, youIncluded: boolean) =>
			`Uitgenodigd: ${count} sollicitanten${youIncluded ? ', jij ook' : ''}.`,
		notInvited: (count: number, youIncluded: boolean) =>
			`Niet uitgenodigd: ${count} sollicitanten${youIncluded ? ', jij ook' : ''}.`,
		replay: 'Speel opnieuw af',
		tallyChange: (shape: string, before: number, after: number, total: number) =>
			`${shape}: eerst ${before} van ${total} op gesprek, nu ${after} van ${total}.`
	},
	outcome: {
		nowIn: 'Je mag nu op gesprek!',
		stillIn: 'Je mag nog steeds op gesprek.',
		nowOut: 'Je mag niet meer op gesprek komen.',
		stillOut: 'Je mag nog steeds niet op gesprek.'
	} satisfies Record<OutcomeChange, string>,
	rules: {
		voted: 'Ik heb gestemd'
	},
	vote: {
		title: 'Voelt dit eerlijk?',
		/**
		 * `thermometer`: the round's thermometer number, or `null` for the bare box.
		 * Each round's vote tablet is named after it.
		 */
		guide: (thermometer: number | null) => {
			const tablet =
				thermometer === null
					? 'tablet bij `het algoritme`'
					: `tablet bij thermometer ${thermometer}`;
			const where = `Stem dan met de knoppen op de ${tablet}`;
			return [
				'Geef met de stempels op je kaartje aan of je geselecteerd bent.',
				thermometer === null
					? `${where}: is het eerlijk om enkel op de score te kiezen?`
					: `${where}: voelt het eerlijk om deze thermometer toe te passen?`
			];
		}
	},
	bareBox: {
		title: 'Het algoritme heeft beslist.',
		rank: (rank: number) => `Jij bent ${ordinal(rank)}.`,
		body: 'Dit is bepaald door de score die je kreeg.',
		stand: 'Zoek je plek op de tafel, en zet je blokje daar.',
		qualified: 'Elke sollicitant in deze lijst heeft al de vereiste vaardigheden.',
		outcomeIn: 'Je bent uitgenodigd!',
		outcomeOut: 'Je bent niet uitgenodigd.',
		detailIn: (slots: number) => `Enkel de top ${slots} mag op gesprek, en daar hoor jij bij.`,
		detailOut: (rank: number, slots: number) => {
			const short = rank - slots;
			return `Enkel de top ${slots} mag op gesprek, dus je komt ${spell(short)} ${short === 1 ? 'plek' : 'plekken'} tekort.`;
		}
	},
	counterfactual: {
		title: 'Zou het anders lopen als jij anders was?',
		makeShape: (shape: Shape) => `Maak me een ${shapeNames[shape]}`,
		makeSize: (size: Size) => `Maak me ${sizeNames[size]}`,
		makeColour: (colour: string) => `Maak me ${colour}`,
		pick: 'Kies één verandering en stuur je cv opnieuw in het algoritme.',
		dragHint: 'Sleep je cv opnieuw in het algoritme',
		send: 'Stuur opnieuw in',
		newScore: (score: number) => `Nieuwe score: ${score}`,
		/** `from`: your place under the bare box; `to`: your place with the changed CV. */
		placeBlock: (from: number, to: number) =>
			from === to
				? `Zet **je blokje** nu weer op plaats ${to}.`
				: `Zet **je blokje** nu op plaats ${to} i.p.v. ${from}.`
	},
	parity: {
		title: 'Krijgt elke vorm een eerlijk deel?',
		body: 'Deze regel zorgt dat **elke vorm** een **even grote kans** heeft op een interview.',
		wall: (shapes: readonly Shape[]) =>
			`Kijk naar het resultaat: er krijgen nu ook ${joinList(shapes.map((s) => shapeNamesPlural[s]))} een interview.`,
		wallNoChange: 'Kijk naar het resultaat: wie krijgt er nu een interview?',
		/** `place`: your rank among the applicants of your own shape. */
		placeBlock: (place: number) => `Zet **je blokje** in de kolom van jouw vorm op plaats ${place}.`
	},
	opportunity: {
		title: 'Vindt het algoritme geschikte mensen voor de job even vaak?',
		/** The screen reads in two parts: first where the algorithm goes wrong, then what the rule changes. */
		parts: {
			matrix: 'Waar vergist het algoritme zich?',
			rule: 'Wat verandert de regel?'
		},
		body: 'Onder de geschikte sollicitanten krijgt nu **elke vorm evenveel kans** op een gesprek.',
		footnote: '*Geschikt: op basis van historische data, bijvoorbeeld een evaluatie na 6 maanden.',
		/** `cell`: where the box put you. */
		placeBlock: (cell: ConfusionCell) =>
			`Zet **je blokje** in het ‘${confusionCellNames[cell].toLowerCase()}’ vierkant.`,
		youQualified: 'Volgens die data ben jij geschikt.',
		youNotQualified: 'Volgens die data ben jij niet geschikt: je doet deze ronde niet mee.',
		matrix: {
			caption: 'Wat het algoritme koos, naast wie echt geschikt was',
			invited: 'Gesprek',
			notInvited: 'Geen gesprek',
			qualified: 'Geschikt*',
			notQualified: 'Niet geschikt',
			cells: confusionCellNames,
			count: (n: number) => (n === 1 ? '1 sollicitant' : `${n} sollicitanten`),
			focus:
				'Deze thermometer kijkt **enkel naar de geschikte rij**: wie terecht gekozen werd, en wie gemist werd.'
		}
	},
	results: {
		title: 'Dit is wat anderen vonden',
		choices: {
			very_unfair: 'Zeer oneerlijk',
			unfair: 'Oneerlijk',
			fair: 'Eerlijk',
			very_fair: 'Zeer eerlijk'
		} satisfies Record<VoteChoice, string>,
		count: (n: number) => (n === 1 ? '1 stem' : `${n} stemmen`),
		empty: 'Nog geen stemmen binnen. De resultaten verschijnen hier vanzelf.',
		unavailable: 'De resultaten zijn nu even niet beschikbaar.',
		/** Where the block goes after each round's results. */
		takeBlock: {
			bare_box: 'Neem **je blokje** terug voor de volgende stap. Ga naar thermometer 1.',
			counterfactual: 'Neem **je blokje** mee naar thermometer 2.',
			parity: 'Neem **je blokje** mee naar thermometer 3.',
			opportunity: 'Neem **je blokje** mee en zet je even op de denkbank verderop.'
		} satisfies Record<RuleId, string>,
		ctaContinue: 'Verder',
		ctaNext: 'Naar de volgende thermometer',
		ctaLast: 'En wat nu?'
	},
	tablet: {
		title: 'Is dit eerlijk?',
		bareBox: {
			name: 'Het onaangepaste algoritme',
			question: 'De hoogste scores mogen op gesprek. Wat is je eerste gevoel?'
		},
		thanks: 'Bedankt! Je stem is geteld.',
		unauthorized:
			'Het wachtwoord is veranderd. Vul het nieuwe wachtwoord in; stemmen blijven bewaard tot dan.',
		password: {
			title: 'Vul het wachtwoord in',
			note: 'Dit hoeft maar één keer op dit toestel te worden ingevuld.',
			label: 'Wachtwoord',
			submit: 'Start',
			wrong: 'Dat wachtwoord klopt niet. Probeer opnieuw.'
		}
	},
	reveal: {
		title: 'Wat betekent dat nu ‘in het echt’?',
		body: 'In het echte leven zijn er natuurlijk geen rode cirkels of gele vierkantjes, maar dezelfde principes kunnen worden gebruikt voor kenmerken die je wél kent:',
		rows: [
			{
				label: 'De vorm & grootte die je kreeg',
				examples: ['gender', 'leeftijd', 'huidskleur']
			},
			{ label: 'De kleur die je koos', examples: ['opleiding', "hobby's", 'vriendenkring'] },
			{
				label: 'Verborgen ‘geschikt’',
				examples: ['er na een jaar nog werken', 'een positieve evaluatie']
			}
		],
		cta: 'Nu is het aan jou'
	},
	ranking: {
		title: 'Welke thermometer vind je het eerlijkst?',
		subtitle: 'Kies tussen deze twee:',
		counter: (current: number, total: number) => `${current}/${total}`,
		or: 'OF',
		previous: 'Vorige vraag',
		resultTitle: 'Jouw volgorde',
		others: {
			title: 'Wat iedereen koos',
			places: { first: '1e plaats', second: '2e plaats' },
			count: (n: number) =>
				n === 1 ? 'Jij bent de eerste die koos.' : `${n} deelnemers, inclusief jezelf.`,
			row: (name: string, first: number, second: number, total: number) =>
				`${name}: ${first} van de ${total} deelnemers zetten deze op de 1e plaats, ${second} op de 2e.`,
			unavailable: 'Wat anderen kozen, is nu even niet beschikbaar.'
		},
		cta: 'Klaar'
	},
	intersection: {
		title: 'Je bent meer dan één groep.',
		labels: { shape: 'vorm', size: 'grootte', colour: 'kleur' },
		diagram: (shape: Shape, size: Size, colour: string) =>
			`Jij zit in drie groepen tegelijk: ${shapeNamesPlural[shape]}, ${sizeNames[size]} en ${colour}.`,
		body: (size: Size, colour: string) => [
			'De thermometers keken slechts naar één ding: je vorm.',
			`Maar je bent ook ${sizeNames[size]}, en je koos ${colour}. Je zit in al die groepen tegelijk.`
		],
		cta: 'En dan?'
	},
	blindSpot: {
		title: 'Het hoekje waar niemand keek.',
		caption: 'Wie mocht op gesprek met ‘gelijk deel’, per vorm en grootte',
		sizes: { small: 'klein', medium: 'middel', large: 'groot' } satisfies Record<Size, string>,
		tally: (invited: number, total: number) => `${invited} van ${total} op gesprek`,
		group: (shape: Shape, size?: Size) =>
			size
				? `${inflectedSize[size]} ${shapeNamesPlural[shape]}`
				: `alle ${shapeNamesPlural[shape]}`,
		barsLegend: 'kreeg een gesprek',
		crowd: (count: number, factor: number) =>
			`Maak de stapel cv’s eens ${spell(factor)} keer zo groot: ${count} sollicitanten.`,
		sorted:
			'Zet ze per vorm en grootte bij elkaar. Elk groepje zit op een kruispunt: één vorm, één grootte.',
		judged: '‘Gelijk deel’ kiest wie op gesprek mag. Wie vervaagt, valt af.',
		shapes: 'Per vorm lijkt het eerlijk: elke vorm kreeg interviews naar verhouding.',
		split: ({ shape, favoured, overlooked }: SubgroupSplit, yourSize?: Size) => {
			const [served, missed] = [favoured.tally, overlooked.tally];
			const you = yourSize
				? ` Jij bent een ${isHetWord[shape] ? sizeNames[yourSize] : inflectedSize[yourSize]} ${shapeNames[shape]}.`
				: '';
			return `Maar binnen de ${shapeNamesPlural[shape]} ${served.invited === 1 ? 'kreeg' : 'kregen'} ${served.invited} van de ${served.total} ${inflectedSize[favoured.size]} een gesprek, tegenover ${missed.invited} van de ${missed.total} ${inflectedSize[overlooked.size]}.${you}`;
		},
		highlight:
			'Dit heet **intersectionaliteit**: je hoort bij meerdere groepen tegelijk, en net waar ze kruisen, kan een regel je missen.',
		step: 'Volgende',
		cta: 'Verder'
	},
	fence: {
		// Soft hyphens (\u00AD) let the long words break in the narrow toggle.
		stages: {
			equality: 'Gelijkheid',
			equity: 'Gelijk\u00ADwaardigheid',
			justice: 'Recht\u00ADvaardigheid'
		} satisfies Record<FenceStage, string>,
		/** The English terms, shown alongside the stages; null when the copy is English already. */
		english: {
			equality: 'equality',
			equity: 'equity',
			justice: 'justice'
		} as Record<FenceStage, string> | null
	},
	equity: {
		title: 'De regel deed meer dan meten.',
		body: 'Een thermometer meet alleen maar. Maar ’gelijk deel’ en ’even vaak gevonden’ veranderden ook wie op gesprek mocht: scoorde een vorm laag, dan kreeg die een duwtje omhoog.',
		legend: 'Vergelijk drie manieren om te helpen',
		captions: {
			equality:
				'**Iedereen krijgt hetzelfde kistje**, zoals het onaangepaste algoritme dezelfde regel gebruikt voor iedereen. Klinkt eerlijk, maar de kleinste kan nog steeds niet over het hek kijken.',
			equity:
				'**Iedereen krijgt de steun die nodig is.** Nu kan iedereen over het hek kijken. Zo werkten ’gelijk deel’ en ’even vaak gevonden’.',
			justice:
				'**Het hek gaat weg.** Dan heeft niemand nog een kistje nodig. Maar hoe krijg je dat hek weg?'
		} satisfies Record<FenceStage, string>,
		cta: 'Verder'
	},
	history: {
		title: 'Die lage scores komen ergens vandaan.',
		past: 'vroeger',
		body: [
			'Het algoritme leerde van oude aanwervingen. Sommige vormen kregen lang minder kansen, en dat zit nu in de cijfers.',
			'Eerlijk sorteren verdeelt de interviewplekken van vandaag opnieuw. Aan wat scheefgroeide, verandert het niets.'
		],
		highlight: 'De kistjes helpen over het hek kijken. Maar **het hek staat er nog**.',
		cta: 'Kan het ook anders?'
	},
	repair: {
		title: 'Een andere vraag: herstel.',
		body: [
			'Sommige onderzoekers vinden eerlijk sorteren niet genoeg. Hun vraag is niet ‘wie mag er vandaag bij?’, maar ‘wie werd benadeeld, en hoe maken we dat goed?’',
			'Bijvoorbeeld: hebben twee kandidaten exact dezelfde kwalificaties, dan gaat wie uit de benadeelde groep komt voor. Alleen dan. Zo krijgt die groep méér kansen, niet precies dezelfde, tot de achterstand is ingehaald.'
		],
		highlight:
			'Dit heet **rechtvaardigheid** (justice): de oorzaak wegwerken, zodat op termijn niemand nog een kistje nodig heeft.',
		cta: 'Wat kies jij?'
	},
	twoWays: {
		title: 'Twee manieren vooruit.',
		options: {
			sort: {
				title: 'Eerlijk sorteren',
				body: 'Eén eerlijke regel, vanaf vandaag. Iedereen krijgt het kistje dat nodig is.'
			},
			repair: {
				title: 'Eerst herstellen',
				body: 'Bij exact dezelfde kwalificaties gaat de benadeelde groep voor, en alleen dan. Meer kansen tot het hek weg is.'
			}
		},
		body: 'Er is geen juist antwoord. Zelfs onderzoekers zijn het hier oneens.',
		card: 'Draai je kaartje om en **vul de vragen in**. Kies dan in **welk team** je zit, door je kaartje **op het bord** te hangen: links voor enkel eerlijk sorteren en rechts voor eerst herstellen.',
		cta: 'Mijn kaartje hangt aan het bord'
	},
	thanks: {
		title: 'Dankjewel!',
		intro: 'Fijn dat je mee nadacht over eerlijke algoritmes.',
		download: {
			title: 'Alles nog eens nalezen?',
			detail: 'Download alle uitleg uit deze demo als pdf.',
			cta: 'Download de pdf'
		},
		credits: 'Deze demo is gemaakt door',
		returnBlock: 'Vergeet niet om **je blokje terug te geven** voor je vertrekt!',
		restart: 'Opnieuw beginnen'
	}
};

export type Messages = typeof nl;
