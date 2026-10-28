import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { INFO_PDF, RESEARCH_GROUPS } from './credits';

const inStatic = (path: string) =>
	existsSync(fileURLToPath(new URL(`../../../static${path}`, import.meta.url)));

describe('credits', () => {
	it.each(Object.entries(INFO_PDF))('ships the %s PDF in static/', (_, pdf) => {
		expect(inStatic(pdf.path)).toBe(true);
	});

	it('gives every language its own PDF', () => {
		const paths = Object.values(INFO_PDF).map((pdf) => pdf.path);
		expect(new Set(paths).size).toBe(paths.length);
	});

	it('ships every logo in static/', () => {
		for (const group of RESEARCH_GROUPS) {
			if (group.logo) expect(inStatic(group.logo)).toBe(true);
		}
	});
});
