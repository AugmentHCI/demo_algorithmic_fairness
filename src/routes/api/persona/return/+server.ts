import { json } from '@sveltejs/kit';
import { personaReturnSchema } from '$lib/api/contracts';
import { DatabaseUnavailableError } from '$lib/server/errors';
import { NO_STORE, readBody, serviceUnavailable } from '$lib/server/http';
import { returnPersona } from '$lib/server/personaBox';
import type { RequestHandler } from './$types';

/**
 * POST /api/persona/return — a participant finished or started over, so their
 * persona goes back in the persona box. Body: `{ "participantId": "<uuid>" }`.
 */
export const POST: RequestHandler = async ({ request }) => {
	const { participantId } = await readBody(request, personaReturnSchema);
	try {
		await returnPersona(participantId);
	} catch (cause) {
		if (!(cause instanceof DatabaseUnavailableError))
			console.error('[persona] Return failed', cause);
		return serviceUnavailable('Could not return the persona');
	}
	return json({ ok: true }, { headers: NO_STORE });
};
