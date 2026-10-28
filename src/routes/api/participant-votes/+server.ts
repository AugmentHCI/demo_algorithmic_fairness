import { json } from '@sveltejs/kit';
import { participantVoteSchema } from '$lib/api/contracts';
import { DatabaseUnavailableError } from '$lib/server/errors';
import { NO_STORE, readBody, serviceUnavailable } from '$lib/server/http';
import { recordParticipantVote } from '$lib/server/votes';
import type { RequestHandler } from './$types';

/**
 * POST /api/participant-votes — a vote cast in the app, in the solo version of
 * the demo. It shows up on the round's results screen like a tablet vote, but
 * as the persona of the participant who cast it. One vote per participant and
 * round: voting again changes it.
 * Body: { "participantId": "<uuid>", "rule": "parity", "choice": "fair",
 *         "personaId": "p07", "colourId": "green" }
 */
export const POST: RequestHandler = async ({ request }) => {
	const vote = await readBody(request, participantVoteSchema);
	try {
		await recordParticipantVote(vote);
	} catch (cause) {
		if (!(cause instanceof DatabaseUnavailableError))
			console.error('[participant-votes] Upsert failed', cause);
		return serviceUnavailable('Could not store the vote');
	}
	return json({ ok: true }, { status: 201, headers: NO_STORE });
};
