/**
 * The project URL supabase-js expects (`https://<ref>.supabase.co`), also from
 * an API URL copied from the dashboard: the client adds `/rest/v1` itself, and
 * a doubled path makes every request fail (PostgREST error PGRST125).
 * `null` when the value is not a URL at all.
 */
export function projectUrl(value: string): string | null {
	try {
		const url = new URL(value.trim());
		url.pathname = url.pathname.replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
		url.search = '';
		url.hash = '';
		return url.href.replace(/\/+$/, '');
	} catch {
		return null;
	}
}
