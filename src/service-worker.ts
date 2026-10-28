/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

/**
 * Offline copy of the vote tablet pages. Registered by the tablet page only,
 * with scope `/tablet/`, so participants' phones never use it. A tablet that
 * has opened its page once can reload it without wifi; its votes wait in the
 * outbox until the connection is back. With wifi, pages always come from the
 * network, so a tablet never gets stuck on an old copy. The API is never cached.
 */

import { build, files, prerendered, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `tablet-${version}`;
/** How long a page load waits for the network before showing the offline copy. */
const NETWORK_TIMEOUT_MS = 4_000;
const TABLET_PAGES = prerendered.filter((path) => path.includes('/tablet/'));
const ASSETS = [...build, ...files, ...TABLET_PAGES];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
			)
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	if (url.origin !== sw.location.origin || url.pathname.startsWith('/api/')) return;
	event.respondWith(request.mode === 'navigate' ? networkFirst(request) : cacheFirst(request));
});

/**
 * Pages come from the network whenever it answers in time, so a reload always
 * shows the current deploy and follows redirects (e.g. to a new domain, where
 * the votes must go). The copy is only for when the wifi is down, or too slow.
 */
async function networkFirst(request: Request): Promise<Response> {
	const fromNetwork = fetch(request);
	const fallback = new Promise<Response | undefined>((resolve) =>
		setTimeout(() => void cached(request).then(resolve), NETWORK_TIMEOUT_MS)
	);
	try {
		const response = await Promise.race([fromNetwork, fallback]);
		if (response) return response;
	} catch {
		// Offline: fall back to the copy below.
	}
	return (await cached(request)) ?? fromNetwork;
}

/** Build files have a hash in their name: a copy can never be out of date. */
async function cacheFirst(request: Request): Promise<Response> {
	return (await cached(request)) ?? fetch(request);
}

async function cached(request: Request): Promise<Response | undefined> {
	const cache = await caches.open(CACHE);
	return cache.match(new URL(request.url).pathname);
}
