import { getContext, setContext } from 'svelte';
import type { Locale } from '$lib/domain/types';
import { en } from './en';
import { nl, type Messages } from './nl';

export type { Messages };

export const LOCALES: readonly Locale[] = ['nl', 'en'];
export const DEFAULT_LOCALE: Locale = 'nl';
/**
 * The start page, and the solo version it leads to, open in English: they are
 * shared beyond the workshop. The language switch offers Dutch.
 */
export const START_LOCALE: Locale = 'en';

const LOCALE_KEY = 'fairness-demo:locale';

const dictionaries: Record<Locale, Messages> = { nl, en };

export function isLocale(value: unknown): value is Locale {
	return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** The language the participant picked in this tab (start page or switch), if any. */
export function loadLocale(): Locale | null {
	try {
		const locale = sessionStorage.getItem(LOCALE_KEY);
		return isLocale(locale) ? locale : null;
	} catch {
		// Storage unavailable (or no browser): nothing was picked.
		return null;
	}
}

export function saveLocale(locale: Locale): void {
	try {
		sessionStorage.setItem(LOCALE_KEY, locale);
	} catch {
		// Private mode or full storage: the language just won't survive a refresh.
	}
}

/**
 * Reactive translations. Components read `i18n.t.some.key`; switching
 * `i18n.locale` re-renders every text that depends on it.
 */
export class I18n {
	locale = $state<Locale>(DEFAULT_LOCALE);
	readonly t: Messages = $derived(dictionaries[this.locale]);

	static dictionary(locale: Locale): Messages {
		return dictionaries[locale];
	}
}

const KEY = Symbol('i18n');

export function setI18n(i18n: I18n): I18n {
	return setContext(KEY, i18n);
}

export function getI18n(): I18n {
	const i18n = getContext<I18n | undefined>(KEY);
	if (!i18n) throw new Error('getI18n() must be called inside the root layout');
	return i18n;
}
