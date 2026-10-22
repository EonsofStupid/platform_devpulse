<!--
	@file CompleteView.svelte
	@module @devpulse/domains/app/models/feature/setup-wizard/feature/views/complete

	Step 5 — Handoff to dashboard. `onFinish` marks setup complete in
	the kernel + closes the overlay. The wizard does NOT auto-open
	on subsequent launches once `[onboarding].completed = true` lands
	in the user preferences TOML (per ONBOARDING-CASCADE Layer 4).
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Text } from "@devpulse/coldlight/components/text";
import type { CompleteViewProps } from "../../util/wizard.types.js";
import OverlayShell from "../OverlayShell.svelte";

let { copy, busy, callbacks }: CompleteViewProps = $props();
</script>

<OverlayShell
	label="DevPulse setup — complete"
	step={5}
	totalSteps={5}
	title={copy?.title ?? ""}
>
	{#if !copy}
		<div class="loading-row"><Spinner size="sm" /></div>
	{:else}
		<Heading level={3} size="md">{copy.title}</Heading>
		<Text size="sm" class="text-frost-300">{copy.subtitle_template}</Text>
	{/if}

	{#snippet footer()}
		<div class="flex-1"></div>
		<Button
			preset="primary"
			size="sm"
			onclick={callbacks.onFinish}
			disabled={!copy || busy}
		>
			{#if busy}<Spinner size="xs" />{/if}
			Open dashboard
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
