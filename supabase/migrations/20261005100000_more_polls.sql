-- Besides the four rounds, people now also vote on the two ways forward (on a
-- tablet: sort fairly or repair first) and, in the app, on whether their view
-- on fair algorithms changed. `rule` holds the poll id; every poll has its own
-- answers, so rule and choice are checked together.

alter table public.votes
	drop constraint if exists votes_rule_check,
	drop constraint if exists votes_choice_check;

alter table public.votes
	add constraint votes_rule_choice_check check (
		(
			rule in ('bare_box', 'counterfactual', 'parity', 'opportunity')
			and choice in ('very_unfair', 'unfair', 'fair', 'very_fair')
		)
		or (rule = 'two_ways' and choice in ('sort', 'repair'))
		or (rule = 'opinion' and choice in ('yes', 'no'))
	);
