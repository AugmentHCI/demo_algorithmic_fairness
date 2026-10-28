-- The persona box.
--
-- Every persona also exists on paper, in one box at the entrance: starting
-- participants take a block out of it, and whoever finishes throws theirs back
-- in. The app mirrors that box, so participants with the same block step into
-- a persona of it that nobody else is playing at that moment. A persona comes
-- back as soon as its participant finishes, which a fixed rotation could not
-- follow: it replaces the slot sequence of the initial schema.

drop function if exists public.claim_persona_slot();
drop function if exists public.reset_persona_rotation();
drop sequence if exists public.persona_rotation_seq;

create table if not exists public.persona_holds (
	event_id text not null check (char_length(event_id) between 1 and 64),
	persona_id text not null check (char_length(persona_id) <= 16),
	-- The participant playing this persona now; null while it is in the box.
	participant_id uuid,
	-- When the persona was last taken out of the box; null if it never was.
	taken_at timestamptz,
	primary key (event_id, persona_id)
);

create index if not exists persona_holds_participant_idx
	on public.persona_holds (event_id, participant_id)
	where participant_id is not null;

alter table public.persona_holds enable row level security;

-- Take a persona of a block out of the box for a participant, and return its id.
-- `p_persona_ids` are the block's personas, in the app's order of preference.
-- In order, the participant gets:
--   1. the persona they already hold (a retry or a refresh changes nothing);
--   2. a persona in the box: one never taken, or else the one taken out the longest ago;
--   3. when the block is all taken (more phones than blocks, or someone tapped
--      the wrong block), the one taken out the longest ago.
-- A hold older than `p_hold_minutes` counts as back in the box: its phone was
-- most likely abandoned without reaching the end.
create or replace function public.take_persona(
	p_event_id text,
	p_block text,
	p_participant_id uuid,
	p_persona_ids text[],
	p_hold_minutes integer
)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
	chosen text;
begin
	if coalesce(cardinality(p_persona_ids), 0) = 0 then
		raise exception 'take_persona: the block has no personas';
	end if;

	-- One participant at a time per block, so two never take the same persona.
	perform pg_advisory_xact_lock(hashtextextended(p_event_id || '/' || p_block, 0));

	insert into public.persona_holds (event_id, persona_id)
	select p_event_id, persona_id from unnest(p_persona_ids) as persona_id
	on conflict (event_id, persona_id) do nothing;

	select hold.persona_id into chosen
	from public.persona_holds as hold
	join unnest(p_persona_ids) with ordinality as preferred (persona_id, position)
		on preferred.persona_id = hold.persona_id
	where hold.event_id = p_event_id
	order by
		hold.participant_id is not distinct from p_participant_id desc,
		hold.participant_id is not null
			and hold.taken_at > now() - make_interval(mins => p_hold_minutes),
		hold.taken_at nulls first,
		preferred.position
	limit 1;

	-- Someone who changes block throws their previous persona back in.
	update public.persona_holds
	set participant_id = null
	where event_id = p_event_id
		and participant_id = p_participant_id
		and persona_id <> chosen;

	update public.persona_holds
	set participant_id = p_participant_id, taken_at = now()
	where event_id = p_event_id and persona_id = chosen;

	return chosen;
end;
$$;

-- A participant finished (or started over): their persona goes back in the box.
create or replace function public.return_persona(p_event_id text, p_participant_id uuid)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
	update public.persona_holds
	set participant_id = null
	where event_id = p_event_id and participant_id = p_participant_id;
$$;

-- Optional: put every persona back in the box (e.g. after a rehearsal).
--   select public.empty_persona_holds();
create or replace function public.empty_persona_holds()
returns void
language sql
volatile
security definer
set search_path = ''
as $$
	delete from public.persona_holds;
$$;

revoke all on function public.take_persona(text, text, uuid, text[], integer)
	from public, anon, authenticated;
revoke all on function public.return_persona(text, uuid) from public, anon, authenticated;
revoke all on function public.empty_persona_holds() from public, anon, authenticated;

grant execute on function public.take_persona(text, text, uuid, text[], integer) to service_role;
grant execute on function public.return_persona(text, uuid) to service_role;
grant execute on function public.empty_persona_holds() to service_role;
