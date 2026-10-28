/**
 * A short buzz to confirm that a vote counted. Works where the browser offers
 * the Vibration API (Android tablets and phones); elsewhere, such as on iPhones
 * and iPads, it does nothing and the on-screen feedback has to do.
 */
export function buzz(pattern: VibratePattern = 40): void {
	if (!('vibrate' in navigator)) return;
	try {
		navigator.vibrate(pattern);
	} catch {
		// Blocked (e.g. in a cross-origin frame): no buzz, nothing else to do.
	}
}
