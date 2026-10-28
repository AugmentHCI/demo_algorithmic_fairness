import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { getSupabaseConfig } from './env';

/** Upper bound for a single database request, so a slow network never hangs a participant. */
const DB_TIMEOUT_MS = 4_000;

export type Db = SupabaseClient<Database>;

let cached: Db | null | undefined;

/**
 * Shared server-side Supabase client (one per serverless instance), or `null`
 * when Supabase is not configured yet.
 */
export function getDb(): Db | null {
	if (cached !== undefined) return cached;

	const config = getSupabaseConfig();
	if (!config) {
		console.warn('[supabase] Not configured: running in offline mode (see .env.example).');
		cached = null;
		return cached;
	}

	cached = createClient<Database>(config.url, config.secretKey, {
		auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
		global: { fetch: fetchWithTimeout }
	});
	return cached;
}

const fetchWithTimeout: typeof fetch = (input, init) => {
	const timeout = AbortSignal.timeout(DB_TIMEOUT_MS);
	const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
	return fetch(input, { ...init, signal });
};
