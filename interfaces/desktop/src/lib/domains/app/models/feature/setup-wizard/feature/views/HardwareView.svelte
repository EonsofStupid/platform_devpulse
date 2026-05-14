<!--
	@file HardwareView.svelte
	@module @devpulse/domains/app/models/feature/setup-wizard/feature/views/hardware

	Step 2 — Detected GPU / VRAM / CPU readout + tier badge. Reads
	live values from `hardwareState` via the props the dispatcher
	supplies; this file never imports the rune directly.

	Tier 4 surface (`--surface-inset`) is used for the nested
	metric wells so the depth stack reads as backdrop → card →
	body → wells.
-->
<script lang="ts">
import { ChevronRight } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { formatMb } from "../../../../util/format.js";
import type { HardwareViewProps } from "../../util/wizard.types.js";
import OverlayShell from "../OverlayShell.svelte";

let { copy, tier, gpuName, hasGpu, vramTotalMb, busy, callbacks }: HardwareViewProps = $props();
</script>

<OverlayShell
	label="DevPulse setup — hardware"
	step={2}
	totalSteps={5}
	title={copy?.title ?? ""}
>
	{#if !copy || !tier}
		<div class="loading-row"><Spinner size="sm" /></div>
	{:else}
		<Heading level={3} size="md">{tier.label}</Heading>
		<Text size="sm" class="text-frost-300">{tier.description}</Text>

		<div class="metrics">
			<Card preset="matte" class="well">
				<Text size="xs" class="text-frost-500">{copy.gpu_label}</Text>
				<Text size="xs">
					{gpuName ?? (hasGpu ? "Detecting…" : "—")}
				</Text>
			</Card>
			{#if hasGpu}
				<Card preset="matte" class="well">
					<Text size="xs" class="text-frost-500">{copy.vram_label}</Text>
					<Text size="xs">
						{vramTotalMb !== null ? formatMb(vramTotalMb) : "—"}
					</Text>
				</Card>
			{/if}
		</div>
	{/if}

	{#snippet footer()}
		<Button preset="button-ghost" size="sm" onclick={callbacks.onBack}>
			Back
		</Button>
		<Button
			preset="button-ghost"
			size="sm"
			onclick={callbacks.onSkip}
			disabled={busy}
		>
			Skip — assign manually
		</Button>
		<div class="flex-1"></div>
		<Button
			preset="button-primary"
			size="sm"
			onclick={callbacks.onNext}
			disabled={!copy || !tier || busy}
		>
			Continue <ChevronRight size={14} />
		</Button>
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
	.metrics {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		margin-top: 0.25rem;
	}
	/* Tier 4 — `<Card preset="matte">` provides the visual chrome.
	   Layout-only override here: flex justify-between + padding the
	   matte preset doesn't own. */
	.well {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
	}
</style>
