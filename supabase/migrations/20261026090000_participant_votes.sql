-- In the solo version of the demo ("by myself") participants vote in the app
-- instead of on a tablet, also on the two ways forward (poll `two_ways`, which
-- the workshop answers on paper). Such a vote knows its voter: it carries the
-- participant and the persona and colour they play, so the results show it as
-- that persona instead of pairing it with an arrival. Votes from the tablets
-- and buttons leave these columns empty.

alter table public.votes
	add column if not exists participant_id uuid,
	add column if not exists persona_id text check (char_length(persona_id) <= 16),
	add column if not exists colour_id text check (colour_id in ('yellow', 'green', 'blue', 'red'));

alter table public.votes
	drop constraint if exists votes_voter_check,
	drop constraint if exists votes_participant_rule_key;

alter table public.votes
	-- A vote knows all of its voter, or nothing about them.
	add constraint votes_voter_check check (
		(participant_id is null) = (persona_id is null)
		and (persona_id is null) = (colour_id is null)
	),
	-- One vote per participant and poll: voting again changes it. Votes
	-- without a participant never clash, as nulls are never equal.
	add constraint votes_participant_rule_key unique (event_id, rule, participant_id);
