-- Votes from the tablets carry an id the tablet generates itself. A tablet on
-- flaky wifi retries a vote until it is confirmed; the unique id makes such a
-- retry harmless (the server ignores a vote it already stored), so every tap
-- counts exactly once. Physical buttons may leave it empty.

alter table public.votes
	add column if not exists client_id uuid constraint votes_client_id_key unique;
