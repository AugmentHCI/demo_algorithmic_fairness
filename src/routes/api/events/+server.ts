import { json } from '@sveltejs/kit';
import { participantEventsSchema } from '$lib/api/contracts';
import { DatabaseUnavailableError } from '$lib/server/errors';
import { NO_STORE, readBody, serviceUnavailable } from '$lib/server/http';
import { recordParticipantEvents } from '$lib/server/participantEvents';
import type { RequestHandler } from './$types';

/**
 * POST /api/events — moments of participants' runs (opened the demo, reached
 * the end, downloaded the PDF), for the analysis after an event. Repeats are harmless.
 * Body: { "events": [{ "participantId": "<uuid>", "kind": "finished", "at": 1760870400000 }] }
 */
export const POST: RequestHandler = async ({ request }) => {
	const { events } = await readBody(request, participantEventsSchema);
	try {
		await recordParticipantEvents(events);
	} catch (cause) {
		if (!(cause instanceof DatabaseUnavailableError))
			console.error('[events] Insert failed', cause);
		return serviceUnavailable('Could not store the events');
	}
	return json({ ok: true }, { status: 201, headers: NO_STORE });
};
