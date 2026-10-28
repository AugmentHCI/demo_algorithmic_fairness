import { error, json } from '@sveltejs/kit';
import { getTabletPassword } from '$lib/server/env';
import { hasBearerToken, NO_STORE } from '$lib/server/http';
import type { RequestHandler } from './$types';

/**
 * POST /api/tablet-password — lets a vote tablet check the password it was
 * given before remembering it. Header: `Authorization: Bearer <password>`.
 * Answers 200 when it is right, 401 when it is not; nothing is stored.
 */
export const POST: RequestHandler = async ({ request }) => {
	if (!(await hasBearerToken(request, getTabletPassword()))) error(401, 'Wrong password');
	return json({ ok: true }, { headers: NO_STORE });
};
