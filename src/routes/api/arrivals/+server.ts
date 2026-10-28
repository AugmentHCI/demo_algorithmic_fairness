import { json } from '@sveltejs/kit';
import { arrivalSchema } from '$lib/api/contracts';
import { DatabaseUnavailableError } from '$lib/server/errors';
import { NO_STORE, readBody, serviceUnavailable } from '$lib/server/http';
import { recordArrival } from '$lib/server/votes';
import type { RequestHandler } from './$types';

/**
 * POST /api/arrivals — a phone reached a round's vote screen. The results
 * screens use these to show each tablet vote as the persona who likely cast it.
 * Body: { "participantId": "<uuid>", "rule": "parity", "personaId": "p07", "colourId": "green" }
 */
export const POST: RequestHandler = async ({ request }) => {
	const arrival = await readBody(request, arrivalSchema);
	try {
		await recordArrival(arrival);
	} catch (cause) {
		if (!(cause instanceof DatabaseUnavailableError))
			console.error('[arrivals] Insert failed', cause);
		return serviceUnavailable('Could not store the arrival');
	}
	return json({ ok: true }, { status: 201, headers: NO_STORE });
};
