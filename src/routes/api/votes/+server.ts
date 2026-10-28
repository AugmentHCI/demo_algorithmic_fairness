import { error, json } from '@sveltejs/kit';
import { ruleIdSchema, voteIngestSchema } from '$lib/api/contracts';
import { DatabaseUnavailableError } from '$lib/server/errors';
import { getTabletPassword, getVoteIngestToken } from '$lib/server/env';
import {
	CDN_CACHED,
	hasBearerToken,
	NO_STORE,
	readBody,
	serviceUnavailable
} from '$lib/server/http';
import { getVoteSummary, recordVote } from '$lib/server/votes';
import type { RequestHandler } from './$types';

/**
 * GET /api/votes?rule=bare_box → aggregated votes for the results screens.
 * Everyone in the room polls this, so it is cached on the CDN for a second.
 */
export const GET: RequestHandler = async ({ url }) => {
	const rule = ruleIdSchema.safeParse(url.searchParams.get('rule'));
	if (!rule.success) error(400, 'Unknown or missing `rule` parameter');

	try {
		const summary = await getVoteSummary(rule.data);
		return json(summary, { headers: CDN_CACHED });
	} catch (cause) {
		if (!(cause instanceof DatabaseUnavailableError))
			console.error('[votes] Summary failed', cause);
		return serviceUnavailable('Vote results are not available right now');
	}
};

/**
 * POST /api/votes — used by the physical vote buttons and the vote tablets.
 * Header: `Authorization: Bearer <VOTE_INGEST_TOKEN>` (buttons) or
 *         `Authorization: Bearer <TABLET_PASSWORD>` (tablets).
 * Body:   { "rule": "bare_box", "choice": "fair", "station": "table-1", "id": "<uuid>" }
 * `station` and `id` are optional; a repeated `id` is stored only once.
 */
export const POST: RequestHandler = async ({ request }) => {
	const token = getVoteIngestToken();
	const [isTablet, isButton] = await Promise.all([
		hasBearerToken(request, getTabletPassword()),
		token ? hasBearerToken(request, token) : false
	]);
	if (!isTablet && !isButton) error(401, 'Invalid or missing token');

	const vote = await readBody(request, voteIngestSchema);
	try {
		await recordVote(vote);
	} catch (cause) {
		if (!(cause instanceof DatabaseUnavailableError)) console.error('[votes] Insert failed', cause);
		return serviceUnavailable('Could not store the vote');
	}
	return json({ ok: true }, { status: 201, headers: NO_STORE });
};
