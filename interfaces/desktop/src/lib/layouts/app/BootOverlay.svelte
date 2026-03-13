<!--
  @file BootOverlay.svelte
  @module @devpulse/layouts/app/BootOverlay
  @layer lib

  Full-viewport overlay displayed during platform boot.
  Shows per-subsystem progress with status indicators and latencies.
  Fades out and unmounts when boot completes.

  ## Built with ColdLight
  All visual elements use design system components:
  - Box for containers and rows
  - Stack/HStack for layout
  - Text for typography
  - Badge for status indicators
  - Progress for boot progress bar

  ## Status Accuracy Contract
  Every SubsystemState has exactly one visual representation:
    pending  → default badge, no text
    loading  → info badge, "..."
    ready    → success badge, latency in ms (or "ok" if no latency)
    skipped  → default badge, "disabled"
    failed   → error badge, "failed"
-->
<script lang="ts">
import { platformState } from "$lib/sys/runes/platformState.svelte.js";
import type { SubsystemState } from "$lib/sys/runes/platformState.svelte.js";
import { DEV_MODE, devLabel, resolveLabel } from "$lib/sys/generated/terminology.js";
import { getIcon } from "$lib/sys/generated/terminology-icons.js";
import { Text, Stack, HStack, Box, Badge, Progress } from "$lib/design/index.js";
import type { BadgeIntent } from "$lib/design/index.js";

let visible = $state(true);
let fading = $state(false);

const subsystems = $derived(platformState.subsystemList());

/** Map subsystem state to Badge intent — each state has exactly one visual */
function stateToIntent(state: SubsystemState): BadgeIntent {
	switch (state) {
		case "ready": return "success";
		case "loading": return "info";
		case "failed": return "error";
		case "skipped": return "default";
		case "pending": return "default";
	}
}

/** Map subsystem state to status text — accurate, no lies */
function stateToLabel(state: SubsystemState, latencyMs: number | null): string {
	switch (state) {
		case "pending": return "";
		case "loading": return "...";
		case "ready": return latencyMs !== null ? `${latencyMs}ms` : "ok";
		case "skipped": return "disabled";
		case "failed": return "failed";
	}
}

$effect(() => {
	if (platformState.isReady && !fading) {
		fading = true;
		setTimeout(() => {
			visible = false;
		}, 600);
	}
});
</script>

{#if visible}
<div
	class="boot-overlay"
	class:boot-overlay--fading={fading}
	aria-label="Platform booting"
	role="status"
>
	<Stack gap="6" align="center" class="boot-overlay__content">
		<!-- Wordmark -->
		<Stack gap="1" align="center">
			<Text size="lg" weight="bold">DevPulse</Text>
			<Text size="xs" color="muted">Platform Engine</Text>
		</Stack>

		<!-- Subsystem list -->
		<Stack gap="2" class="w-full">
			{#each subsystems as sub (sub.name)}
				{@const Icon = getIcon(sub.name)}
				{@const label = stateToLabel(sub.state, sub.latencyMs)}
				<Box
					surface="glass-void"
					bevel="subtle"
					frame="soft"
					radius="md"
					class="px-3 py-1.5 {sub.state === 'skipped' ? 'opacity-50' : ''}"
				>
					<HStack gap="3" align="center">
						<Badge
							intent={stateToIntent(sub.state)}
							size="sm"
							decorative
							class="h-2 w-2 min-w-0 p-0"
						>
							&ZeroWidthSpace;
						</Badge>
						{#if Icon}
							<svelte:component this={Icon} size={14} class="shrink-0 text-text-muted" />
						{/if}
						<Text size="sm" color={sub.state === "skipped" ? "muted" : "secondary"} class="flex-1">
							{DEV_MODE ? devLabel(sub.name) : resolveLabel(sub.name)}
						</Text>
						{#if label}
							<Text size="xs" color="muted">{label}</Text>
						{/if}
					</HStack>
				</Box>
			{/each}

			{#if subsystems.length === 0}
				<Text size="xs" color="muted">Waiting for subsystems...</Text>
			{/if}
		</Stack>

		<!-- Progress bar -->
		<Progress
			value={platformState.progress}
			max={100}
			size="sm"
			surface="glass-void"
			glow="teal"
			class="w-full"
		/>

		<!-- Error state -->
		{#if platformState.hasFailed && platformState.error}
			<Box
				surface="glass-void"
				frame="soft"
				radius="md"
				class="w-full px-3 py-2 text-center border border-red-500/20 bg-red-500/10"
			>
				<Text size="xs" color="accent">{platformState.error}</Text>
			</Box>
		{/if}
	</Stack>
</div>
{/if}

<style>
	/* Overlay positioning — the ONLY hand-written CSS.
	   Fixed viewport cover is layout scaffolding, not a component concern. */
	.boot-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--surface-base, #0a0a0f);
		opacity: 1;
		transition: opacity 500ms ease-out;
	}

	.boot-overlay--fading {
		opacity: 0;
		pointer-events: none;
	}

	.boot-overlay__content {
		min-width: 320px;
		max-width: 400px;
		padding: 2rem;
	}
</style>
