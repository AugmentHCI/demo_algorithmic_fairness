import { RULE_IDS } from '$lib/domain/types';
import type { EntryGenerator, PageLoad } from './$types';

// One static page per round, served from the CDN: a tablet only ever loads it once.
export const prerender = true;

export const entries: EntryGenerator = () => RULE_IDS.map((poll) => ({ poll }));

export const load: PageLoad = ({ params }) => ({ poll: params.poll });
