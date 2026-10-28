import { error, json } from '@sveltejs/kit';
import type { z } from 'zod';

export const NO_STORE = { 'cache-control': 'no-store' } as const;

/**
 * For responses every phone in the room polls: the CDN serves them for a
 * second, so the database sees at most one query per second however many
 * phones are waiting.
 */
export const CDN_CACHED = {
	'cache-control': 'public, max-age=0, s-maxage=1, stale-while-revalidate=10'
} as const;

/** Parse and validate a JSON request body, answering 400 on anything unexpected. */
export async function readBody<Schema extends z.ZodType>(
	request: Request,
	schema: Schema
): Promise<z.infer<Schema>> {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Request body must be valid JSON');
	}
	const parsed = schema.safeParse(body);
	if (!parsed.success)
		error(400, `Invalid request: ${parsed.error.issues[0]?.message ?? 'unknown'}`);
	return parsed.data;
}

export function serviceUnavailable(message: string): Response {
	return json({ message }, { status: 503, headers: NO_STORE });
}

/**
 * Check an `Authorization: Bearer <token>` header. Both values are hashed first
 * and compared without early exit, so the response time does not leak the token.
 */
export async function hasBearerToken(request: Request, expected: string): Promise<boolean> {
	const header = request.headers.get('authorization') ?? '';
	const match = /^Bearer\s+(.+)$/i.exec(header.trim());
	if (!match?.[1]) return false;

	const [given, wanted] = await Promise.all([sha256(match[1]), sha256(expected)]);
	let difference = 0;
	for (let i = 0; i < wanted.length; i++) difference |= (given[i] ?? 0) ^ (wanted[i] ?? 0);
	return difference === 0;
}

async function sha256(value: string): Promise<Uint8Array> {
	return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
}
