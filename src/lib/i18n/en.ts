import type { ConfusionCell } from '$lib/domain/confusion';
import type { Shape, Size } from '$lib/domain/types';
import type { Messages } from './nl';

const shapeNames: Record<Shape, string> = {
	circle: 'circle',
	square: 'square',
	triangle: 'triangle'
};

const shapeNamesPlural: Record<Shape, string> = {
	circle: 'circles',
	square: 'squares',
	triangle: 'triangles'
};

const sizeNames: Record<Size, string> = {
	small: 'small',
	medium: 'medium-sized',
	large: 'large'
};

const confusionCellNames: Record<ConfusionCell, string> = {
	truePositive: 'Rightly picked',
	falseNegative: 'Missed',
	falsePositive: 'Wrongly picked',
	trueNegative: 'Rightly turned down'
};

const numberWords = [
	'zero',
	'one',
	'two',
	'three',
	'four',
	'five',
	'six',
	'seven',
	'eight',
	'nine',
	'ten'
];
const spell = (n: number) => numberWords[n] ?? String(n);

const ORDINAL_SUFFIXES: Readonly<Record<number, string>> = { 1: 'st', 2: 'nd', 3: 'rd' };

function ordinal(n: number): string {
	const lastTwo = n % 100;
	if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
	return `${n}${ORDINAL_SUFFIXES[n % 10] ?? 'th'}`;
}

const joinList = (items: readonly string[]) =>
	items.length <= 1
		? (items[0] ?? '')
		: `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

export const en: Messages = {
	meta: {
		title: 'Is the algorithm fair?',
		description: 'An interactive demo about fair hiring algorithms.'
	},
	common: {
		next: 'Next',
		back: 'Previous step',
		progress: (step, total) => `Step ${step} of ${total}`,
		switchLanguage: 'Schakel naar Nederlands',
		switchLanguageShort: 'NL',
		you: 'you',
		or: 'or',
		yourCv: 'your CV',
		guideName: 'Pim, your guide',
		showGuide: 'Show explanation',
		hideGuide: 'Hide explanation',
		guideNew: 'new'
	},
	shapes: shapeNames,
	sizes: sizeNames,
	colours: {
		yellow: 'yellow',
		green: 'green',
		blue: 'blue',
		red: 'red'
	},
	describePersona: (size, shape) => `A ${sizeNames[size]} ${shapeNames[shape]}`,
	language: {
		title: 'Which language would you like to use?',
		choose: 'English'
	},
	start: {
		title: 'How are you participating?',
		intro:
			'Welcome! In this demo you find out for yourself whether an algorithm chooses fairly. You can do it by yourself, or together with others as part of a workshop.',
		options: {
			solo: {
				title: 'By myself',
				body: 'On your own phone or computer. Everything happens in the app.'
			},
			workshop: {
				title: 'As part of a workshop',
				body: 'With blocks, stickers and vote tablets.'
			}
		}
	},
	world: {
		title: 'Welcome to a world of shapes.',
		body: 'In this world there are no people. Only shapes, in different sizes, but not all shapes and sizes are equal here.',
		stand: 'You just got a block: that’s you.'
	},
	identity: {
		title: 'Which block did you get?',
		legend: 'Your block',
		guide: [
			'Take your block and have a good look.',
			'What shape is it? And is it large or small? Tap the same block below.'
		],
		hello: (size, shape) => `Hi there, ${sizeNames[size]} ${shapeNames[shape]}!`,
		chosen:
			'You don’t choose your shape and size: you were given them, just like your block. They’re on your CV too.',
		score: (score) => `The algorithm gave you a score of **${score}** for this job.`,
		cta: 'This is my block',
		ctaDisabled: 'Pick your block first',
		solo: {
			title: 'Who are you?',
			guide: [
				'In this world, you don’t choose your shape and size: you are given them.',
				'Let’s find out who you are.'
			],
			cta: 'Show me who I am'
		}
	},
	colour: {
		title: 'Now you choose something yourself.',
		body: 'Your friends, your hobbies, your education: those you do choose. In this world, your colour stands for all of those choices.',
		legend: 'Choose a colour',
		sticker: 'Take **your colour sticker** and stick it on your block.',
		cta: 'Choose this colour',
		ctaDisabled: 'Choose a colour first'
	},
	applicants: {
		title: 'There are hundreds of applications. One of them is yours.',
		body: 'A company is looking for the most suitable person for a job, and uses an algorithm to help choose. You are one of the applicants, so your CV is in the pile too.',
		highlight: 'Feel free to take a seat on the application bench.'
	},
	blackBox: {
		title: 'But nobody knows exactly how it works.',
		body: [
			'We call it a ‘**black box**’: you see what goes in and what comes out, but what happens in between is too complex to follow.',
			'The algorithm learned from past hiring decisions. And it is not perfect: it is only right in about 7 out of 10 cases.'
		],
		cta: 'So why do they use it?'
	},
	algorithm: {
		title: 'Too many CVs, too little time.',
		body: 'So the company uses it anyway: the algorithm gives every applicant a score and ranks them. Its developers say it only looks at relevant information in your CV.',
		cta: 'How do we know if this is fair?'
	},
	preview: {
		title: 'You are going to experience it yourself.',
		body: [
			'In the next steps you will try a few ways to adjust who the algorithm invites for an interview.',
			'Each time, you say whether it feels fair.'
		],
		stand: 'Grab your block to get started.',
		cta: 'I have my block'
	},
	score: {
		title: 'Your CV goes into the algorithm.',
		dragHint: 'Drag your CV into the algorithm',
		apply: 'Apply',
		processing: 'The algorithm is calculating…',
		baseLabel: (score) => `Score without your colour: ${score}`,
		scoreLabel: (score, effect) => `Your score: ${score}, of which ${effect} from your colour`,
		body: [
			'This is the score the company gets for your CV: a number from 1 to 100. The higher your score, the better your chance of an interview.',
			'Soon we will put it next to everyone else’s.'
		],
		cta: 'Next'
	},
	unaware: {
		title: 'Easy fix: just hide your shape?',
		body: [
			'The scores put some shapes at more of a disadvantage than others. Could we make it fairer by hiding the shapes?',
			'If the algorithm can’t see your shape, it can’t be unfair to triangles, right? That sounds logical.'
		],
		cta: 'Does that work?'
	},
	headInSand: {
		title: 'Not really.',
		body: [
			'The algorithm still guesses your shape, from other things that often go with it. And now you can’t even check whether it is fair.',
			'You can’t see the problem anymore, but it’s still there.'
		],
		highlight: 'This is called **fairness through unawareness**.',
		cta: 'So how then?'
	},
	thermometers: {
		title: 'That’s why we do look.',
		body: [
			'To know whether the algorithm is fair, we have to put its choices right next to your shape.',
			'That’s what tests are for. We will call them **thermometers**. Today there are more than 50 of them. We will look at three.'
		],
		cta: 'Do we need to run all those tests?'
	},
	tradeOff: {
		title: 'And you will have to choose.',
		body: 'Which thermometer counts most depends on what you find important. You cannot use them all at once. Sometimes they clash.',
		stand: 'Follow the arrow to the next part of the stand.',
		cta: "Let's begin!"
	},
	thermometer: {
		label: (n) => `Thermometer ${n}`,
		names: {
			counterfactual: 'your shape alone',
			parity: 'equal share',
			opportunity: 'found equally often'
		},
		questions: {
			counterfactual: 'Would you get the same result if only your shape or size changed?',
			parity: 'Does every shape get as many places?',
			opportunity: 'Does the algorithm find suitable people equally often for every shape?'
		}
	},
	candidates: {
		invited: (count, youIncluded) =>
			`Invited: ${count} applicants${youIncluded ? ', including you' : ''}.`,
		notInvited: (count, youIncluded) =>
			`Not invited: ${count} applicants${youIncluded ? ', including you' : ''}.`,
		replay: 'Play again',
		tallyChange: (shape, before, after, total) =>
			`${shape}: ${before} of ${total} invited before, ${after} of ${total} now.`
	},
	outcome: {
		nowIn: 'You get an interview now!',
		stillIn: 'You still get an interview.',
		nowOut: 'You don’t get an interview any more.',
		stillOut: 'You still don’t get an interview.'
	},
	rules: {
		voted: 'I have voted'
	},
	vote: {
		title: 'Does this feel fair?',
		guide: (thermometer) => {
			const tablet =
				thermometer === null ? 'algorithm tablet' : `thermometer ${thermometer} tablet`;
			const where = `Then vote with the buttons on the ${tablet}`;
			return [
				'Use the stamps on your card to show whether you were selected.',
				thermometer === null
					? `${where}: is it fair to choose on the score alone?`
					: `${where}: is it fair to apply this thermometer?`
			];
		}
	},
	bareBox: {
		title: 'The algorithm has decided.',
		rank: (rank) => `You are ${ordinal(rank)}.`,
		body: 'This was decided by the score you were given.',
		stand: 'Find your place on the table and put your block there.',
		qualified: 'Every applicant in this list already has the required skills.',
		outcomeIn: 'You are invited!',
		outcomeOut: 'You are not invited.',
		detailIn: (slots) => `Only the top ${slots} get an interview, and you are one of them.`,
		detailOut: (rank, slots) => {
			const short = rank - slots;
			return `Only the top ${slots} get an interview, so you are ${spell(short)} ${short === 1 ? 'place' : 'places'} short.`;
		}
	},
	counterfactual: {
		title: 'Would things go differently if you were different?',
		makeShape: (shape) => `Make me a ${shapeNames[shape]}`,
		makeSize: (size) => `Make me ${sizeNames[size]}`,
		makeColour: (colour) => `Make me ${colour}`,
		pick: 'Choose one change and send your CV into the algorithm again.',
		dragHint: 'Drag your CV into the algorithm again',
		send: 'Send it in again',
		newScore: (score) => `New score: ${score}`,
		placeBlock: (from, to) =>
			from === to
				? `Put **your block** back in place ${to}.`
				: `Put **your block** in place ${to} now, instead of ${from}.`
	},
	parity: {
		title: 'Does every shape get a fair share?',
		body: 'This rule makes sure **every shape** has an **equal chance** of getting a place.',
		wall: (shapes) =>
			`Look at the results: now ${joinList(shapes.map((s) => shapeNamesPlural[s]))} get an interview too.`,
		wallNoChange: 'Look at the results: who gets an interview now?',
		placeBlock: (place) => `Put **your block** in the column of your shape, in place ${place}.`
	},
	opportunity: {
		title: 'Does the algorithm find people suitable for the job equally often?',
		parts: {
			matrix: 'Where does the algorithm get it wrong?',
			rule: 'What does the rule change?'
		},
		body: 'Among the suitable applicants, **every shape now gets the same chance** of an interview.',
		footnote: '*Suitable: based on historical data, for example an evaluation after 6 months.',
		placeBlock: (cell) =>
			`Put **your block** in the ‘${confusionCellNames[cell].toLowerCase()}’ square.`,
		youQualified: 'According to that data, you are suitable.',
		youNotQualified:
			'According to that data, you are not suitable: you are not part of this round.',
		matrix: {
			caption: 'What the algorithm chose, next to who was truly suitable',
			invited: 'Interview',
			notInvited: 'No interview',
			qualified: 'Suitable*',
			notQualified: 'Not suitable',
			cells: confusionCellNames,
			count: (n) => (n === 1 ? '1 applicant' : `${n} applicants`),
			focus:
				'This thermometer **only looks at the suitable row**: who was rightly picked, and who was missed.'
		}
	},
	results: {
		title: 'This is what others thought',
		choices: {
			very_unfair: 'Very unfair',
			unfair: 'Unfair',
			fair: 'Fair',
			very_fair: 'Very fair'
		},
		count: (n) => (n === 1 ? '1 vote' : `${n} votes`),
		empty: 'No votes yet. Results will appear here automatically.',
		unavailable: 'Results are not available right now.',
		takeBlock: {
			bare_box: 'Pick up **your block** again for the next step. Go to thermometer 1.',
			counterfactual: 'Take **your block** with you to thermometer 2.',
			parity: 'Take **your block** with you to thermometer 3.',
			opportunity: 'Take **your block** with you and have a seat on the thinking bench further on.'
		},
		ctaContinue: 'Next',
		ctaNext: 'On to the next thermometer',
		ctaLast: 'So what now?'
	},
	tablet: {
		title: 'Is this fair?',
		bareBox: {
			name: 'The bare algorithm',
			question: 'The highest scores get an interview. What is your first feeling?'
		},
		thanks: 'Thank you! Your vote has been counted.',
		unauthorized: 'The password has changed. Enter the new password; votes are kept until then.',
		password: {
			title: 'Enter the password',
			note: 'Only needed once on this device.',
			label: 'Password',
			submit: 'Start',
			wrong: 'That password is not right. Try again.'
		}
	},
	reveal: {
		title: 'So what does this mean ‘in real life’?',
		body: 'In real life there are of course no red circles or yellow squares, but the same principles can be applied to characteristics you do know:',
		rows: [
			{ label: 'The shape & size you were given', examples: ['gender', 'age', 'skin colour'] },
			{ label: 'The colour you chose', examples: ['education', 'hobbies', 'circle of friends'] },
			{
				label: 'Hidden ‘suitable’',
				examples: ['still working there after a year', 'a positive evaluation']
			}
		],
		cta: 'Now it is up to you'
	},
	ranking: {
		title: 'Which thermometer do you find most fair?',
		subtitle: 'Choose what you find most important!',
		counter: (current, total) => `${current}/${total}`,
		or: 'OR',
		previous: 'Previous question',
		resultTitle: 'Your order',
		others: {
			title: 'What everyone chose',
			places: { first: '1st place', second: '2nd place' },
			count: (n) =>
				n === 1 ? 'You are the first to choose.' : `${n} participants, including you.`,
			row: (name, first, second, total) =>
				`${name}: ${first} of the ${total} participants put this in 1st place, ${second} in 2nd.`,
			unavailable: 'What others chose is not available right now.'
		},
		cta: 'Done'
	},
	intersection: {
		title: 'You are more than one group.',
		labels: { shape: 'shape', size: 'size', colour: 'colour' },
		diagram: (shape, size, colour) =>
			`You belong to three groups at once: ${shapeNamesPlural[shape]}, ${sizeNames[size]} and ${colour}.`,
		body: (size, colour) => [
			'The thermometers only looked at one thing: your shape.',
			`But you are also ${sizeNames[size]}, and you chose ${colour}. You belong to all of those groups at once.`
		],
		cta: 'So what?'
	},
	blindSpot: {
		title: 'The corner nobody checked.',
		caption: 'Who got an interview under ‘equal share’, by shape and size',
		sizes: { small: 'small', medium: 'medium', large: 'large' },
		tally: (invited, total) => `${invited} of ${total} invited`,
		group: (shape, size) =>
			size ? `${sizeNames[size]} ${shapeNamesPlural[shape]}` : `all ${shapeNamesPlural[shape]}`,
		barsLegend: 'got an interview',
		crowd: (count, factor) =>
			`Now make the pile of CVs ${spell(factor)} times bigger: ${count} applicants.`,
		sorted:
			'Group them by shape and size. Each little group sits where one shape and one size cross.',
		judged: '‘Equal share’ picks who gets an interview. The faded ones are out.',
		shapes: 'Per shape it looks fair: every shape got its proportional share of places.',
		split: ({ shape, favoured, overlooked }, yourSize) => {
			const [served, missed] = [favoured.tally, overlooked.tally];
			const you = yourSize ? ` You are a ${sizeNames[yourSize]} ${shapeNames[shape]}.` : '';
			return `But inside the ${shapeNamesPlural[shape]}, ${served.invited} of the ${served.total} ${sizeNames[favoured.size]} ones got an interview, against ${missed.invited} of the ${missed.total} ${sizeNames[overlooked.size]} ones.${you}`;
		},
		highlight:
			'This is called **intersectionality**: you belong to several groups at once, and right where they cross, a rule can miss you.',
		step: 'Continue',
		cta: 'Next'
	},
	fence: {
		stages: {
			equality: 'Equality',
			equity: 'Equity',
			justice: 'Justice'
		},
		english: null
	},
	equity: {
		title: 'The rule did more than measure.',
		body: 'A thermometer only measures. But ’equal share’ and ’found equally often’ also changed who got an interview: when a shape scored low, it sometimes got a boost.',
		legend: 'Compare three ways to help',
		captions: {
			equality:
				'**Everyone gets the same crate**, just like the bare algorithm uses the same rule for everyone. Sounds fair, but the smallest still can’t see over the fence.',
			equity:
				'**Everyone gets the support they need.** Now everyone can see over the fence. That is how ’equal share’ and ’found equally often’ worked.',
			justice:
				'**The fence comes down.** Then nobody needs a crate any more. But how do you get rid of the fence?'
		},
		cta: 'But why do they score low?'
	},
	history: {
		title: 'Those low scores come from somewhere.',
		past: 'the past',
		body: [
			'The algorithm learned from past hiring decisions. Some shapes got fewer chances for a long time, and that is now in the numbers.',
			'Fair sorting shares out today’s places again. It does nothing about what grew crooked.'
		],
		highlight: 'The crates help you see over the fence. But **the fence is still there**.',
		cta: 'Is there another way?'
	},
	repair: {
		title: 'A different question: repair.',
		body: [
			'Some researchers find fair sorting not enough. Their question is not ‘who gets in today?’, but ‘who was held back, and how do we make that right?’',
			'For example: when two candidates have exactly the same qualifications, the one from the disadvantaged group is selected first. That gives the group more chances, not exactly the same ones, until the gap has closed.'
		],
		highlight:
			'This is called **justice**: removing the cause, so that in time nobody needs a crate any more.',
		cta: 'What would you choose?'
	},
	twoWays: {
		title: 'Two ways forward.',
		options: {
			sort: {
				title: 'Sort fairly',
				body: 'One fair rule, starting today. Everyone gets the crate they need.'
			},
			repair: {
				title: 'Repair first',
				body: 'With exactly the same qualifications, the disadvantaged group goes first, and only then. More chances until the fence is gone.'
			}
		},
		body: 'There is no right answer. Even researchers disagree about this.',
		card: 'Turn your card over and **fill in the questions**. Then choose **which team** you are by hanging your card **on the board**: on the left for fair sorting only and on the right for repair first.',
		cta: 'My card is on the board'
	},
	thanks: {
		title: 'Thank you!',
		intro: 'Thanks for thinking along about fair algorithms.',
		download: {
			title: 'Want to read it all again?',
			detail: 'Download all the explanations from this demo as a PDF.',
			cta: 'Download the PDF'
		},
		credits: 'This demo was made by',
		returnBlock: 'Don’t forget to **hand back your block** before you leave!',
		restart: 'Start again'
	}
};
