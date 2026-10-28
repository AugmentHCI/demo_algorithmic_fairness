-- Fairness demo (fairness_demo_an) — initial schema.
--
-- Security model: Row Level Security is enabled on every table and no policies
-- are defined, so the public (anon/publishable) key can read or write nothing.
-- Only the SvelteKit server, using the secret key, talks to the database.

---------------------------------------------------------------------------
-- Persona rotation
---------------------------------------------------------------------------
-- A sequence hands out slot numbers atomically, so participants who start at
-- the same moment never receive the same slot. The app maps slot → persona
-- (slot modulo the number of personas, in a spread-out order).

create sequence if not exists public.persona_rotation_seq as bigint minvalue 0 start with 0;

create or replace function public.claim_persona_slot()
returns bigint
language sql
volatile
security definer
set search_path = ''
as $$
	select nextval('public.persona_rotation_seq');
$$;

-- Optional: start the rotation from the first persona again (e.g. before an event).
--   select public.reset_persona_rotation();
create or replace function public.reset_persona_rotation()
returns void
language sql
volatile
security definer
set search_path = ''
as $$
	select setval('public.persona_rotation_seq', 0, false);
$$;

---------------------------------------------------------------------------
-- Votes from the physical buttons ("Is dit eerlijk?")
---------------------------------------------------------------------------

create table if not exists public.votes (
	id bigint generated always as identity primary key,
	created_at timestamptz not null default now(),
	-- Groups votes per workshop/event; matches the EVENT_ID environment variable.
	event_id text not null default 'default' check (char_length(event_id) between 1 and 64),
	-- Which selection rule was being voted on.
	rule text not null check (rule in ('bare_box', 'counterfactual', 'parity', 'opportunity')),
	choice text not null check (choice in ('very_unfair', 'unfair', 'fair', 'very_fair')),
	-- Optional identifier of the button box / table that sent the vote.
	station text check (char_length(station) <= 64)
);

create index if not exists votes_event_rule_idx on public.votes (event_id, rule);

alter table public.votes enable row level security;

-- Aggregated counts for the "Dit is wat anderen vonden" screens.
create or replace function public.vote_summary(p_event_id text, p_rule text)
returns table (choice text, votes bigint)
language sql
stable
security definer
set search_path = ''
as $$
	select v.choice, count(*)::bigint as votes
	from public.votes v
	where v.event_id = p_event_id and v.rule = p_rule
	group by v.choice;
$$;

---------------------------------------------------------------------------
-- Rankings from the "Welke thermometer moet altijd groen blijven?" screen
---------------------------------------------------------------------------

create table if not exists public.rankings (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	event_id text not null default 'default' check (char_length(event_id) between 1 and 64),
	persona_id text not null check (char_length(persona_id) <= 16),
	locale text not null check (locale in ('nl', 'en')),
	-- Thermometer ids, most important first.
	ranking text[] not null,
	-- Raw pairwise answers: [{ "left": …, "right": …, "winner": … }, …]
	choices jsonb not null
);

create index if not exists rankings_event_idx on public.rankings (event_id);

alter table public.rankings enable row level security;

---------------------------------------------------------------------------
-- Privileges: only the server (service_role / secret key) may use any of this.
---------------------------------------------------------------------------

revoke all on function public.claim_persona_slot() from public, anon, authenticated;
revoke all on function public.reset_persona_rotation() from public, anon, authenticated;
revoke all on function public.vote_summary(text, text) from public, anon, authenticated;

grant execute on function public.claim_persona_slot() to service_role;
grant execute on function public.reset_persona_rotation() to service_role;
grant execute on function public.vote_summary(text, text) to service_role;
grant usage, select on sequence public.persona_rotation_seq to service_role;
