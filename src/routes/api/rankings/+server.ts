import { json } from '@sveltejs/kit';
import { rankingSubmissionSchema } from '$lib/api/contracts';
import { DatabaseUnavailableError } from '$lib/server/errors';
import { CDN_CACHED, NO_STORE, readBody, serviceUnavailable } from '$lib/server/http';
import { getRankingSummary, saveRanking } from '$lib/server/rankings';
import type { RequestHandler } from './$types';

/**
 * GET /api/rankings → everyone's rankings put together, for the ranking screen.
 * Cached on the CDN for a second, like the vote results.
 */
export const GET: RequestHandler = async () => {
	try {
		const summary = await getRankingSummary();
		return json(summary, { headers: CDN_CACHED });
	} catch (cause) {
		if (!(cause instanceof DatabaseUnavailableError))
			console.error('[rankings] Summary failed', cause);
		return serviceUnavailable('Ranking results are not available right now');
	}
};

/** Store a participant's answers from the "which thermometer matters most" screen. */
export const POST: RequestHandler = async ({ request }) => {
	const submission = await readBody(request, rankingSubmissionSchema);
	try {
		await saveRanking(submission);
	} catch (cause) {
		if (!(cause instanceof DatabaseUnavailableError))
			console.error('[rankings] Insert failed', cause);
		return serviceUnavailable('Could not store the ranking');
	}
	return json({ ok: true }, { status: 201, headers: NO_STORE });
};
