import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Svelte 5 runes everywhere in our own code (node_modules decide for themselves).
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter({ runtime: 'nodejs22.x' }),
		// Only the vote tablets use the offline copy: the tablet page registers it itself.
		serviceWorker: { register: false }
	}
};

export default config;
