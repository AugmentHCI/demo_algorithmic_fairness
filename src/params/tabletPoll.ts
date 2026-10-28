import type { ParamMatcher } from '@sveltejs/kit';
import { isRuleId, type RuleId } from '$lib/domain/types';

/** Matches the rounds that have a vote tablet: `bare_box`, …, `opportunity`. */
export const match = ((param: string): param is RuleId => isRuleId(param)) satisfies ParamMatcher;
