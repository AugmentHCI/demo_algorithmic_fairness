import type { Component } from 'svelte';
import Scale from '@lucide/svelte/icons/scale';
import Sprout from '@lucide/svelte/icons/sprout';
import type { FenceStage, PathChoice } from '$lib/domain/types';

/**
 * The two ways forward, as on "Twee manieren vooruit" and its vote tablet:
 * each with its icon and the fence stage it stands for. Texts live in i18n.
 */
export const PATH_OPTIONS: Readonly<
	Record<PathChoice, { readonly icon: Component; readonly stage: FenceStage }>
> = {
	sort: { icon: Scale, stage: 'equity' },
	repair: { icon: Sprout, stage: 'justice' }
};
