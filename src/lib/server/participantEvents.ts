import type { ParticipantEvent } from '$lib/api/contracts';
import { getEventId } from './env';
import { DatabaseUnavailableError } from './errors';
import { getDb } from './supabase';

/** Store moments of participants' runs; a moment already stored keeps its first time. */
export async function recordParticipantEvents(events: readonly ParticipantEvent[]): Promise<void> {
	const db = getDb();
	if (!db) throw new DatabaseUnavailableError();

	const eventId = getEventId();
	const { error } = await db.from('participant_events').upsert(
		events.map((event) => ({
			event_id: eventId,
			participant_id: event.participantId,
			kind: event.kind,
			occurred_at: new Date(event.at).toISOString()
		})),
		{ onConflict: 'event_id,participant_id,kind', ignoreDuplicates: true }
	);
	if (error) throw error;
}
