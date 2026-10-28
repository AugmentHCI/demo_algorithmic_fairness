// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		/** Shallow-routing state: lets the phone's back button move between demo steps. */
		interface PageState {
			step?: number;
			/** Number of demo entries on the history stack before this one. */
			depth?: number;
		}
	}
}

export {};
