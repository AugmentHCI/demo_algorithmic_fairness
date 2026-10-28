import { json } from '@sveltejs/kit';
import { personaRequestSchema } from '$lib/api/contracts';
import { NO_STORE, readBody } from '$lib/server/http';
import { takePersona } from '$lib/server/personaBox';
import type { RequestHandler } from './$types';

/**
 * POST /api/persona — take a persona of the participant's block out of the persona box.
 * Body: who took which block at the table,
 * `{ "participantId": "<uuid>", "shape": "triangle", "size": "small" }`.
 */
export const POST: RequestHandler = async ({ request }) => {
	const body = await readBody(request, personaRequestSchema);
	return json(await takePersona(body), { headers: NO_STORE });
};
