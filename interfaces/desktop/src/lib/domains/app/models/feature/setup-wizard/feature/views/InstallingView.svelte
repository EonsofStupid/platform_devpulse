<!--
	@file InstallingView.svelte
	@module @devpulse/domains/app/models/feature/setup-wizard/feature/views/installing

	Step 4 — Live per-slot install progress. One row per recommended
	slot, each row reads live status from the `dispatchedInstalls`
	prop the dispatcher resolves against the install state rune.

	Per locked rule #2 — Harrier 0.5B must download AND scan. The
	install chain (`installToSlot`) handles both atomically; this
	view only renders progress, never authors the chain.

	Tier 4 surface (`--surface-inset`) per install row so each is
	visibly distinct from the body panel (tier 3).

	No footer actions — the view auto-advances to CompleteView once
	every dispatched install terminates (handled in the dispatcher's
	`$effect`).
-->
<script lang="ts">
import { Card } from "$lib/design/components/card/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { formatMb } from "../../../../util/format.js";
import { getSlotLabel } from "../../../../util/slots.js";
import type { InstallingViewProps } from "../../util/wizard.types.js";
import OverlayShell from "../OverlayShell.svelte";

let {
	copy,
	recommendations,
	dispatchedInstalls,
	dispatchErrors,
	installsRunning,
	installsComplete,
	installsFailed,
	installsTotal,
	installsCachedSkippedDownload,
}: InstallingViewProps = $props();
</script>

<OverlayShell
	label="DevPulse setup — installing"
	step={4}
	totalSteps={5}
	title={copy?.title ?? ""}
>
	{#if !copy}
		<div class="loading-row"><Spinner size="sm" /></div>
	{:else}
		<Heading level={3} size="md">{copy.title}</Heading>
		<Text size="sm" class="text-frost-300">
			{installsComplete + installsFailed} of {installsTotal}
			{#if installsCachedSkippedDownload > 0}
				· {installsCachedSkippedDownload} already on disk
			{/if}
			{#if installsFailed > 0}
				· {installsFailed} failed
			{/if}
		</Text>

		<div class="rows">
			{#each recommendations as rec (rec.slot_id)}
				{@const label = getSlotLabel(rec.slot_id)}
				{@const live = dispatchedInstalls.find((i) => i.slotId === rec.slot_id)}
				{@const dispatchErr = dispatchErrors[rec.slot_id]}
				<Card preset="matte" class="installing-view__row">
					<div class="row-info">
						<Text size="xs" weight="bold">
							{label?.name ?? rec.slot_id}
						</Text>
						<Text size="xs" class="text-frost-500">
							{rec.model_filename} · {formatMb(rec.model_size_mb)}
						</Text>
					</div>
					<div class="row-status">
						{#if dispatchErr}
							<Text size="xs" class="text-brand-coral-400">
								couldn't dispatch: {dispatchErr}
							</Text>
						{:else if !live}
							<Spinner size="xs" />
							<Text size="xs" class="text-frost-500">queued</Text>
						{:else if live.status === "running"}
							<Spinner size="xs" />
							<Text size="xs" class="text-frost-500">
								{rec.already_downloaded ? "loading" : "downloading"}
							</Text>
						{:else if live.status === "complete"}
							<Text size="xs" class="text-brand-green-400">ready</Text>
						{:else if live.status === "failed"}
							<Text size="xs" class="text-brand-coral-400">
								{live.error ?? "failed"}
							</Text>
						{/if}
					</div>
				</Card>
			{/each}
		</div>
	{/if}

	{#snippet footer()}
		{#if installsRunning > 0}
			<Text size="xs" class="text-frost-500">
				{installsRunning} running
			</Text>
		{/if}
		<div class="flex-1"></div>
	{/snippet}
</OverlayShell>

<style>
	.loading-row {
		display: flex;
		justify-content: center;
		padding: 1rem 0;
	}
	.flex-1 {
		flex: 1;
	}
	.rows {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	/* Tier 4 — `<Card preset="matte">` provides visual chrome. Layout-
	   only overrides here. `:global()` because the class is passed to
	   a child `<Card>` component; Svelte's per-file scoper can't track
	   classes across the component boundary. Renamed from `.row` to be
	   collision-proof under global scope. */
	:global(.installing-view__row) {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
	}
	.row-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}
	.row-status {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-shrink: 0;
	}
</style>
