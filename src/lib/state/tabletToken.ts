/**
 * The key a vote tablet sends with every vote: the tablet password (asked once
 * on the tablet page) or the server's `VOTE_INGEST_TOKEN`. The token can also
 * be handed over in the link's fragment, `/tablet/bare_box#token=…`, which
 * browsers never send to a server. Either way it is remembered on the tablet,
 * for every tablet page, so a reload does not ask again.
 */

const STORAGE_KEY = 'fairness-demo:vote-token';

/** The key from `hash` (remembering it), or else the one remembered earlier. */
export function takeTabletToken(hash: string): string | null {
	const fromLink = new URLSearchParams(hash.replace(/^#/, '')).get('token')?.trim();
	if (fromLink) rememberTabletToken(fromLink);
	try {
		return fromLink || localStorage.getItem(STORAGE_KEY);
	} catch {
		// Storage unavailable: the key from the link still works until the next reload.
		return fromLink || null;
	}
}

/** Remember `token` on this tablet, where storage allows it. */
export function rememberTabletToken(token: string): void {
	try {
		localStorage.setItem(STORAGE_KEY, token);
	} catch {
		// Storage unavailable: the key works until the next reload.
	}
}
