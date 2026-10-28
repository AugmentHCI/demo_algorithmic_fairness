import { env } from '$env/dynamic/private';
import { projectUrl } from './supabaseUrl';

/**
 * Server configuration, read at runtime so Vercel env changes apply without a
 * rebuild. Placeholder values from `.env.example` count as "not configured":
 * the app then runs in offline mode (random personas, no vote results) instead
 * of failing.
 */

const isConfigured = (value: string | undefined): value is string =>
	typeof value === 'string' && value.trim() !== '' && !value.includes('YOUR_');

export interface SupabaseConfig {
	readonly url: string;
	readonly secretKey: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
	const url = isConfigured(env.SUPABASE_URL) ? projectUrl(env.SUPABASE_URL) : null;
	const secretKey = env.SUPABASE_SECRET_KEY;
	return url && isConfigured(secretKey) ? { url, secretKey } : null;
}

export function getVoteIngestToken(): string | null {
	const token = env.VOTE_INGEST_TOKEN;
	return isConfigured(token) ? token : null;
}

/**
 * The password a vote tablet asks for once. It is entered by hand, so it is
 * short and the same for every tablet; set `TABLET_PASSWORD` to change it.
 */
const DEFAULT_TABLET_PASSWORD = 'fti-demo';

export function getTabletPassword(): string {
	const password = env.TABLET_PASSWORD?.trim();
	return password || DEFAULT_TABLET_PASSWORD;
}

export function getEventId(): string {
	const eventId = env.EVENT_ID?.trim();
	return eventId && eventId.length <= 64 ? eventId : 'default';
}
