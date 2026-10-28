import type { PersonaRequest, PersonaResponse } from '$lib/api/contracts';
import { PERSONA_HOLD_MINUTES } from '$lib/config';
import { PERSONAS } from '$lib/data/personas';
import { blockKey, personasOfBlock } from '$lib/domain/blocks';
import { handOutOrder } from '$lib/domain/handOutOrder';
import type { Persona } from '$lib/domain/types';
import { getEventId } from './env';
import { DatabaseUnavailableError } from './errors';
import { getDb } from './supabase';

const ORDER = handOutOrder(PERSONAS);

/**
 * Take a persona of the participant's block out of the persona box: one that
 * nobody is playing right now, like the blocks in the physical box (see the
 * `persona_box` migration). If the database is not reachable the participant
 * still gets a (random) persona of their block: the demo must never block on
 * the network.
 */
export async function takePersona({
	participantId,
	...block
}: PersonaRequest): Promise<PersonaResponse> {
	const personas = personasOfBlock(ORDER, block);
	const db = getDb();
	if (db) {
		try {
			const { data, error } = await db.rpc('take_persona', {
				p_event_id: getEventId(),
				p_block: blockKey(block),
				p_participant_id: participantId,
				p_persona_ids: personas.map((persona) => persona.id),
				p_hold_minutes: PERSONA_HOLD_MINUTES
			});
			if (error) throw error;
			const taken = personas.find((persona) => persona.id === data);
			if (taken) return { personaId: taken.id, source: 'box' };
			console.error('[persona] The box handed out a persona of another block:', data);
		} catch (error) {
			console.error('[persona] Could not take a persona from the box, using a random one.', error);
		}
	}
	return { personaId: randomOf(personas).id, source: 'fallback' };
}

/** The participant finished or started over: their persona goes back in the box. */
export async function returnPersona(participantId: string): Promise<void> {
	const db = getDb();
	if (!db) throw new DatabaseUnavailableError();
	const { error } = await db.rpc('return_persona', {
		p_event_id: getEventId(),
		p_participant_id: participantId
	});
	if (error) throw error;
}

function randomOf(personas: readonly Persona[]): Persona {
	const persona = personas[Math.floor(Math.random() * personas.length)];
	if (!persona) throw new Error('No persona matches this block');
	return persona;
}
