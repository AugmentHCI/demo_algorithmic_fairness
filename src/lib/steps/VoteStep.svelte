<!--
	Voting on a round: the thermometer once more and what it meant for you.
	At the workshop, Pim points to the tablet's buttons (to vote) and the stamps
	(to mark whether you were selected), and arriving here is reported, so the
	results can show this participant's tablet vote as their persona. In the
	solo version, the four answers are right here on the screen.
-->
<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import Guide from '$lib/components/Guide.svelte';
	import OutcomeCard from '$lib/components/OutcomeCard.svelte';
	import ThermometerCard from '$lib/components/ThermometerCard.svelte';
	import AtScreenEnd from '$lib/components/ui/AtScreenEnd.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Screen from '$lib/components/ui/Screen.svelte';
	import { outcomeChange } from '$lib/domain/scenario';
	import { THERMOMETER_IDS, VOTE_CHOICES, type RuleId, type VoteChoice } from '$lib/domain/types';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { getJourney } from '$lib/state/journey.svelte';

	let { rule }: { rule: RuleId } = $props();

	const i18n = getI18n();
	const journey = getJourney();
	const t = $derived(i18n.t);

	onMount(() => void journey.arriveAtVote(rule));

	const atWorkshop = journey.mode === 'workshop';

	/** Solo version: the answer picked, starting from the vote given before (when coming back). */
	let choice = $state<VoteChoice | undefined>(untrack(() => journey.votes[rule]));

	function vote() {
		if (!choice) return;
		void journey.vote(rule, choice);
		journey.next();
	}

	/** The round's thermometer number, which names its vote tablet; `null` for the bare box. */
	const thermometer = $derived(rule === 'bare_box' ? null : THERMOMETER_IDS.indexOf(rule) + 1);

	/** What this round meant for you; `null` when there is nothing to tell (yet). */
	const outcome = $derived.by((): { title: string; detail?: string } | null => {
		const scenario = journey.scenario;
		if (!scenario) return null;
		const { outcomes, rank, slots } = scenario;
		const before = outcomes.bare_box.youInvited;
		switch (rule) {
			case 'bare_box':
				return before
					? { title: t.bareBox.outcomeIn, detail: t.bareBox.detailIn(slots) }
					: { title: t.bareBox.outcomeOut, detail: t.bareBox.detailOut(rank, slots) };
			case 'counterfactual':
				return journey.whatIfResult
					? { title: t.outcome[outcomeChange(before, journey.whatIfResult.youInvited)] }
					: null;
			case 'parity':
			case 'opportunity':
				return { title: t.outcome[outcomeChange(before, outcomes[rule].youInvited)] };
		}
	});
</script>

<Screen title={t.vote.title}>
	{#if rule !== 'bare_box'}
		<ThermometerCard thermometer={rule} />
	{/if}

	{#if outcome}
		<OutcomeCard title={outcome.title} detail={outcome.detail} />
	{/if}

	{#if atWorkshop}
		<Guide mood="curious" talkKey={rule}>
			{#each t.vote.guide(thermometer) as paragraph (paragraph)}
				<p>{paragraph}</p>
			{/each}
		</Guide>
	{:else}
		<fieldset class="choices">
			<legend class="visually-hidden">{t.vote.title}</legend>
			{#each VOTE_CHOICES as option (option)}
				<label class="choice">
					<input
						type="radio"
						name="vote"
						value={option}
						bind:group={choice}
						class="visually-hidden"
					/>
					{t.results.choices[option]}
				</label>
			{/each}
		</fieldset>
	{/if}

	{#snippet actions()}
		{#if atWorkshop}
			<AtScreenEnd>
				<Button onclick={() => journey.next()}>{t.rules.voted}</Button>
			</AtScreenEnd>
		{:else}
			<Button onclick={vote} disabled={!choice}>{t.rules.voted}</Button>
		{/if}
	{/snippet}
</Screen>

<style>
	.choices {
		display: grid;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		border: 0;
		min-width: 0;
	}

	.choice {
		display: flex;
		align-items: center;
		min-height: 3.25rem;
		padding: var(--space-2) var(--space-4);
		border: 2px solid var(--line);
		border-radius: var(--radius-m);
		background: var(--card);
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 700;
		cursor: pointer;
		transition:
			border-color 150ms,
			background-color 150ms,
			transform 120ms var(--ease-out);
	}

	.choice:active {
		transform: scale(0.98);
	}

	.choice:has(input:checked) {
		border-color: var(--accent);
		background: var(--accent-soft);
	}

	.choice:has(input:focus-visible) {
		outline: 3px solid var(--accent-strong);
		outline-offset: 3px;
	}
</style>
