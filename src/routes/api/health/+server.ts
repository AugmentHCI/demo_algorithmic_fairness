import { json } from '@sveltejs/kit';
import { getEventId, getVoteIngestToken } from '$lib/server/env';
import { NO_STORE } from '$lib/server/http';
import { getDb } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

/**
 * Pre-event check: open /api/health to confirm the deployment can reach Supabase
 * (free Supabase projects pause after a week without traffic) and that every
 * migration has run (the vote tablets need the `votes.client_id` column).
 */
export const GET: RequestHandler = async () => {
	const db = getDb();
	let database: 'offline' | 'ok' | 'error' = 'offline';
	if (db) {
		const results = await Promise.all([
			db.rpc('vote_summary', { p_event_id: getEventId(), p_rule: 'bare_box' }),
			db.from('votes').select('client_id').limit(0)
		]);
		const errors = results.flatMap(({ error }) => (error ? [error] : []));
		database = errors.length > 0 ? 'error' : 'ok';
		if (errors.length > 0) console.error('[health] Database check failed', errors);
	}
	return json(
		{
			database,
			voteIngestion: getVoteIngestToken() ? 'configured' : 'not configured',
			eventId: getEventId()
		},
		{ status: database === 'error' ? 503 : 200, headers: NO_STORE }
	);
};
