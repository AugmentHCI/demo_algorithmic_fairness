import { rankingChoicesSchema, type RankingSubmission } from '$lib/api/contracts';
import { RANKED_THERMOMETERS } from '$lib/config';
import { rankFromChoices } from '$lib/domain/pairwise';
import { summariseRankings, type RankingSummary } from '$lib/domain/rankingSummary';
import { getEventId } from './env';
import { DatabaseUnavailableError } from './errors';
import { getDb } from './supabase';

/** How many rankings are read for the summary: far more than one event collects. */
const MAX_ROWS = 5000;

export async function saveRanking(submission: RankingSubmission): Promise<void> {
	const db = getDb();
	if (!db) throw new DatabaseUnavailableError();

	const { error } = await db.from('rankings').insert({
		event_id: getEventId(),
		persona_id: submission.personaId,
		locale: submission.locale,
		ranking: submission.ranking,
		choices: submission.choices
	});
	if (error) throw error;
}

/**
 * Everyone's rankings of this event put together. Each ranking is worked out
 * again from its pairwise answers, as on the phone, so shared places count as
 * shared; the stored order cannot tell them apart.
 */
export async function getRankingSummary(): Promise<RankingSummary> {
	const db = getDb();
	if (!db) throw new DatabaseUnavailableError();

	const { data, error } = await db
		.from('rankings')
		.select('choices')
		.eq('event_id', getEventId())
		.order('created_at')
		.limit(MAX_ROWS);
	if (error) throw error;

	const rankings = data.flatMap((row) => {
		const choices = rankingChoicesSchema.safeParse(row.choices);
		return choices.success ? [rankFromChoices(RANKED_THERMOMETERS, choices.data)] : [];
	});
	return summariseRankings(RANKED_THERMOMETERS, rankings);
}
