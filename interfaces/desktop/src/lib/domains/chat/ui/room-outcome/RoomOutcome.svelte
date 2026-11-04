<!--
	@component RoomOutcome
	@module @devpulse/domains/chat/ui/room-outcome

	How a room's run ended: why it stopped, what it picked and why, what was held
	against it, where it sent the question, and the Council it opened.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { Text } from "@devpulse/coldlight/components/text";
import { fill } from "$lib/sys/copy/index.js";
import type { RoomOutcomeProps } from "./room-outcome.types.js";

let { copy, outcome, placeLabel, onOpenCouncil }: RoomOutcomeProps = $props();

const stopped = $derived(
	{
		rounds: copy.stopped_rounds,
		stable: copy.stopped_stable,
		passed: copy.stopped_passed,
	}[outcome.stopped],
);
const pick = $derived(outcome.pick);
const route = $derived(outcome.route ?? null);
</script>

<Card variant="deep" class="gap-3 p-4" data-ui="chat-room-outcome" aria-label={copy.outcome_title}>
	<div class="flex flex-wrap items-center gap-2">
		<Text size="sm" weight="semibold">{copy.outcome_title}</Text>
		<Text size="xs">{fill(stopped, { rounds: outcome.rounds })}</Text>
	</div>
	{#if pick}
		{#if pick.tie}
			<Text size="sm">{copy.tie}</Text>
		{:else if pick.winnerPlace}
			<div class="flex flex-wrap items-center gap-2">
				<Badge variant="positive">{fill(copy.picked, { place: placeLabel(pick.winnerPlace) })}</Badge>
				{#if pick.runnerUp}<Text size="xs">{fill(copy.runner_up, { place: pick.runnerUp })}</Text>{/if}
			</div>
		{:else}
			<Text size="sm">{fill(copy.no_pick, { reason: pick.problem ?? "" })}</Text>
		{/if}
		{#if pick.rationale.length > 0}
			<div class="flex flex-col gap-1">
				<Text size="xs" weight="semibold">{copy.reasons}</Text>
				{#each pick.rationale as reason (reason)}<Text size="xs">{reason}</Text>{/each}
			</div>
		{/if}
		{#if pick.dissent.length > 0}
			<div class="flex flex-col gap-1">
				<Text size="xs" weight="semibold">{copy.dissent}</Text>
				{#each pick.dissent as point (point)}<Text size="xs">{point}</Text>{/each}
			</div>
		{/if}
	{/if}
	{#if route}
		{#if route.escalate}
			<div class="flex flex-wrap items-center gap-2">
				<Text size="sm">{copy.escalated}</Text>
				{#if onOpenCouncil}<Button size="sm" variant="secondary" onclick={onOpenCouncil}>{copy.open_council}</Button>{/if}
			</div>
		{:else if route.place}
			<Badge variant="informative">{fill(copy.routed, { place: placeLabel(route.place) })}</Badge>
		{/if}
		{#if route.rationale}<Text size="xs">{route.rationale}</Text>{/if}
		{#if route.problem}<Text size="xs">{fill(copy.failed, { reason: route.problem })}</Text>{/if}
	{/if}
	{#if outcome.flips.length > 0}
		<div class="flex flex-col gap-1">
			<Text size="xs" weight="semibold">{copy.flips}</Text>
			{#each outcome.flips as flip (flip)}<Text size="xs">{placeLabel(flip)}</Text>{/each}
		</div>
	{/if}
</Card>
