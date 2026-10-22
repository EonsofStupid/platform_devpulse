<!--
	@file PresetView.svelte
	@module @devpulse/domains/app/models/feature/setup-wizard/feature/views/preset

	Step 3 — Preset selection. Hardware tier already determined what
	the recommended preset is (computed kernel-side via
	`autoConfigure`). This view confirms the choice + offers the
	"already have files on disk" escape hatch as a visible Skip
	button (not a buried `<Text>` mention).

	`onApplyAutoConfig` kicks off the install chain and advances to
	the InstallingView. Until the cascade resolver lands, copy comes
	from `ProfileCopy` (the existing kernel-side struct used by the
	current wizard for this step).
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Text } from "@devpulse/coldlight/components/text";
import { ChevronRight } from "lucide-svelte";
import type { PresetViewProps } from "../../util/wizard.types.js";
import OverlayShell from "../OverlayShell.svelte";

let { copy, busy, callbacks }: PresetViewProps = $props();
</script>

<OverlayShell
	label="DevPulse setup — preset"
	step={3}
	totalSteps={5}
	title={copy?.title ?? ""}
>
	{#if !copy}
		<div class="loading-row"><Spinner size="sm" /></div>
	{:else}
		<Heading level={3} size="md">{copy.title}</Heading>
		<Text size="sm" class="text-frost-300">{copy.subtitle}</Text>
	{/if}

	{#snippet footer()}
		<Button variant="ghost" size="sm" onclick={callbacks.onBack}>
			Back
		</Button>
		<Button
			variant="ghost"
			size="sm"
			onclick={callbacks.onSkip}
			disabled={busy}
		>
			Skip — assign manually
		</Button>
		<div class="flex-1"></div>
		<Button
			variant="primary"
			size="sm"
			onclick={callbacks.onApplyAutoConfig}
			disabled={!copy || busy}
		>
			{#if busy}<Spinner size="xs" />{/if}
			Install recommended models <ChevronRight size={14} />
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
</style>
