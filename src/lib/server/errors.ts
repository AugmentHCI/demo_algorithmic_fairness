/** Thrown when Supabase is not configured (offline mode). */
export class DatabaseUnavailableError extends Error {
	constructor() {
		super('Supabase is not configured');
		this.name = 'DatabaseUnavailableError';
	}
}
