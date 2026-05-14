<!--
	@file WelcomeView.svelte
	@module @devpulse/domains/app/models/feature/setup-wizard/feature/views/welcome

	Step 1 — Clyffy greeting + primary CTA. First impression: blue
	accent, Clyffy mascot in the header, single typed `copy` prop
	per the ONBOARDING-CASCADE Layer 2 contract.

	Shows a `Spinner` if copy hasn't loaded yet — never falls back to
	hardcoded English (locked rule against `??` defaults). The
	`onSkip` callback marks setup complete and routes to the Slot
	Orchestrator devtool for users who already have GGUFs on disk.
-->
<script lang="ts">
import { ChevronRight } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import type { WelcomeViewProps } from "../../util/wizard.types.js";
import OverlayShell from "../OverlayShell.svelte";

let { copy, busy, callbacks }: WelcomeViewProps = $props();
</script>

<OverlayShell
	label="DevPulse setup — welcome"
	step={1}
	totalSteps={5}
	title={copy?.title ?? ""}
>
	{#if !copy}
		<div class="loading-row"><Spinner size="sm" /></div>
	{:else}
		<Text size="sm">{copy.subtitle}</Text>
		<Text size="xs" class="text-frost-500">{copy.hint}</Text>
	{/if}

	{#snippet footer()}
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
			disabled={!copy || busy}
			aria-label={copy?.cta_aria ?? ""}
		>
			{#if busy}<Spinner size="xs" />{/if}
			{copy?.cta_label ?? ""} <ChevronRight size={14} />
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
