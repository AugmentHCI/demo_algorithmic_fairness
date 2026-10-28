/**
 * Geometry of the crowd picture, in units of 1% of the stage's width (so it
 * scales with the screen): first a loose crowd, then one natural-looking
 * cluster per shape × size, invited people on the left of their cluster.
 * Only sizes someone in the crowd has get a column.
 */
import type { Candidate, Shape, Size } from '$lib/domain/types';
import { SHAPES, SIZES } from '$lib/domain/types';
import { shuffled } from '$lib/utils/random';

export interface Point {
	readonly x: number;
	readonly y: number;
}

export interface Box {
	readonly left: number;
	readonly top: number;
	readonly width: number;
	readonly height: number;
}

export interface MatrixLayout {
	/** Height of the stage, in the same units as its width of 100. */
	readonly height: number;
	/** Centre of every person, by candidate id. */
	readonly spots: ReadonlyMap<string, Point>;
	/** Centres of the size labels above the columns. */
	readonly columns: readonly { readonly size: Size; readonly centre: Point }[];
	/** Centres of the shape labels in front of the rows. */
	readonly rows: readonly { readonly shape: Shape; readonly centre: Point }[];
	/** The box around each cluster, for pointing one out; only for sizes that have a column. */
	readonly clusters: Readonly<Record<Shape, Readonly<Partial<Record<Size, Box>>>>>;
}

/** Width of a person's glyph. */
export const AVATAR = 4.5;
/** Distance between neighbours in a cluster (the glyphs barely touch, as in a crowd). */
const SPACING = 4.2;
/** Spacing of the sunflower spiral clusters start from, before they are eased apart. */
const SPIRAL_SCALE = SPACING / 2;
/** Clusters are wider than tall, to keep the rows low on a phone. */
const STRETCH = 1.2;
const LABEL_WIDTH = 8;
const HEADER_HEIGHT = 7.5;
const ROW_GAP = 2;
/** Vogel's spiral: each point turns by the golden angle, so none line up. */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

type Person = Pick<Candidate, 'id' | 'shape' | 'size'>;

/** Everyone in their shape × size cluster: rows of shapes, columns of sizes. */
export function matrixLayout(
	people: readonly Person[],
	invitedIds: ReadonlySet<string>,
	random: () => number
): MatrixLayout {
	const sizes = SIZES.filter((size) => people.some((p) => p.size === size));
	const columnWidth = (100 - LABEL_WIDTH) / Math.max(1, sizes.length);
	const rowsOfClusters = SHAPES.map((shape) => ({
		shape,
		clusters: sizes.map((size) => {
			const members = people.filter((p) => p.shape === shape && p.size === size);
			return { size, members, offsets: clusterOffsets(members.length, random) };
		})
	}));

	const spots = new Map<string, Point>();
	const boxes = Object.fromEntries(SHAPES.map((shape) => [shape, {}])) as Record<
		Shape,
		Partial<Record<Size, Box>>
	>;
	const rows: { shape: Shape; centre: Point }[] = [];
	let top = HEADER_HEIGHT;

	for (const { shape, clusters } of rowsOfClusters) {
		const rowHeight = Math.max(AVATAR, ...clusters.map(({ offsets }) => extent(offsets).height));
		const centreY = top + rowHeight / 2;
		rows.push({ shape, centre: { x: LABEL_WIDTH / 2, y: centreY } });

		clusters.forEach(({ size, members, offsets }, column) => {
			const centre = { x: LABEL_WIDTH + columnWidth * (column + 0.5), y: centreY };
			// The invited take the spots on the left, so the cluster splits into two sides.
			const ordered = [...members].sort(
				(a, b) => Number(invitedIds.has(b.id)) - Number(invitedIds.has(a.id))
			);
			const leftToRight = [...offsets].sort((a, b) => a.x - b.x);
			ordered.forEach((person, i) => {
				const offset = leftToRight[i] as Point;
				spots.set(person.id, { x: centre.x + offset.x, y: centre.y + offset.y });
			});

			const { width, height, left, top: boxTop } = extent(offsets);
			boxes[shape][size] = {
				left: centre.x + left,
				top: centre.y + boxTop,
				width,
				height
			};
		});
		top += rowHeight + ROW_GAP;
	}

	return {
		height: top - ROW_GAP,
		spots,
		columns: sizes.map((size, column) => ({
			size,
			centre: { x: LABEL_WIDTH + columnWidth * (column + 0.5), y: HEADER_HEIGHT / 2 }
		})),
		rows,
		clusters: boxes
	};
}

/** Everyone spread loosely over a stage of the given height, in random places. */
export function scatterLayout(
	people: readonly Person[],
	height: number,
	random: () => number
): Map<string, Point> {
	// A jittered grid: random-looking, but nobody lands on top of somebody else.
	const columns = Math.max(1, Math.round(Math.sqrt((people.length * 100) / height)));
	const rows = Math.max(1, Math.ceil(people.length / columns));
	const cell = { width: (100 - AVATAR) / columns, height: (height - AVATAR) / rows };
	const places = shuffled(
		Array.from({ length: columns * rows }, (_, i) => i),
		random
	);

	return new Map(
		people.map((person, i) => {
			const place = places[i] as number;
			const jitter = () => (random() - 0.5) * 0.6;
			return [
				person.id,
				{
					x: AVATAR / 2 + cell.width * ((place % columns) + 0.5 + jitter()),
					y: AVATAR / 2 + cell.height * (Math.floor(place / columns) + 0.5 + jitter())
				}
			];
		})
	);
}

/** Spots for `count` people around (0, 0): a sunflower pattern, shaken and then eased apart. */
function clusterOffsets(count: number, random: () => number): Point[] {
	const turn = random() * 2 * Math.PI;
	const spiral = Array.from({ length: count }, (_, i) => {
		const radius = SPIRAL_SCALE * Math.sqrt(i + 0.5);
		const angle = turn + i * GOLDEN_ANGLE;
		const shake = () => (random() - 0.5) * SPACING * 0.2;
		return {
			x: radius * Math.cos(angle) * STRETCH + shake(),
			y: (radius * Math.sin(angle)) / STRETCH + shake()
		};
	});
	return centred(pushApart(spiral, SPACING));
}

/** The points moved so the box around them is centred on (0, 0). */
function centred(points: readonly Point[]): Point[] {
	const box = extent(points);
	const dx = box.left + box.width / 2;
	const dy = box.top + box.height / 2;
	return points.map((p) => ({ x: p.x - dx, y: p.y - dy }));
}

/**
 * Nudge points that are closer than `distance` away from each other, a few
 * rounds over, until nobody overlaps (the spiral packs its centre tighter
 * than its edge, and the shake and stretch add to that).
 */
function pushApart(points: readonly Point[], distance: number, rounds = 60): Point[] {
	const moved = points.map((p) => ({ ...p }));
	for (let round = 0; round < rounds; round++) {
		let settled = true;
		for (let i = 0; i < moved.length; i++) {
			for (let j = i + 1; j < moved.length; j++) {
				const a = moved[i]!;
				const b = moved[j]!;
				const dx = b.x - a.x;
				const dy = b.y - a.y;
				const gap = Math.hypot(dx, dy);
				if (gap >= distance) continue;
				settled = false;
				// Coinciding points have no direction between them, so pick one.
				const [ux, uy] = gap > 1e-6 ? [dx / gap, dy / gap] : [1, 0];
				const push = (distance - gap) / 2;
				a.x -= ux * push;
				a.y -= uy * push;
				b.x += ux * push;
				b.y += uy * push;
			}
		}
		if (settled) break;
	}
	return moved;
}

/** The box around a cluster's glyphs, relative to its centre. */
function extent(offsets: readonly Point[]): Box {
	if (offsets.length === 0) return { left: 0, top: 0, width: 0, height: 0 };
	const xs = offsets.map((p) => p.x);
	const ys = offsets.map((p) => p.y);
	const left = Math.min(...xs) - AVATAR / 2;
	const top = Math.min(...ys) - AVATAR / 2;
	return {
		left,
		top,
		width: Math.max(...xs) + AVATAR / 2 - left,
		height: Math.max(...ys) + AVATAR / 2 - top
	};
}
