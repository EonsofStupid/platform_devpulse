<!--
  @file BootOverlay.svelte
  @module @devpulse/layouts/app/BootOverlay

  Full-viewport overlay during platform boot.
  Shows per-subsystem progress with status indicators and latencies.
  Fades out and unmounts when boot completes.

  All layout via utils (hstack, stack, box -> class strings).
  All visual via ColdLight components (Badge, Text, Progress).

	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { Badge, type BadgeVariant } from "$lib/design/components/badge/index.js";
import { DynamicBackground } from "$lib/design/components/dynamic-background/index.js";
import { Progress } from "$lib/design/components/progress/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { DEV_MODE, devLabel, resolveLabel } from "$lib/sys/generated/terminology.js";
import { getIcon } from "$lib/sys/generated/terminology-icons.js";
import type { SubsystemState } from "$lib/sys/runes/platformState.svelte.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";

let visible = $state(true);
let fading = $state(false);

const subsystems = $derived(platformState.subsystemList());

function stateToVariant(state: SubsystemState): BadgeVariant {
	switch (state) {
		case "ready":
			return "positive";
		case "loading":
			return "informative";
		case "failed":
			return "negative";
		case "skipped":
			return "neutral";
		case "pending":
			return "neutral";
	}
}

function stateToLabel(state: SubsystemState, latencyMs: number | null): string {
	switch (state) {
		case "pending":
			return "";
		case "loading":
			return "...";
		case "ready":
			return latencyMs !== null ? `${latencyMs}ms` : "ok";
		case "skipped":
			return "disabled";
		case "failed":
			return "failed";
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
	class={cn(
		"fixed inset-0 z-[9999] flex items-center justify-center",
		"transition-opacity duration-500 ease-out",
		fading && "opacity-0 pointer-events-none",
	)}
	aria-label="Platform booting"
	role="status"
>
	<DynamicBackground
		variant="boot"
		src="/imgs/backgrounds/maincontentbackground.png"
	/>
	<div class={cn(stack({ gap: "24", align: "center" }), "min-w-[320px] max-w-[400px] p-[var(--space-32)]")}>
		<!-- Wordmark -->
		<div class={stack({ gap: "4", align: "center" })}>
			<Text size="lg" weight="bold">DevPulse</Text>
			<div class={hstack({ gap: "8", align: "center", justify: "center" })}>
				<span
					class="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent-teal-main)] shrink-0 animate-pulse"
				></span>
				<Text size="xs" color="muted">{platformState.bootStepLabel}</Text>
			</div>
		</div>

		<!-- Subsystem list -->
		<div class={cn(stack({ gap: "8" }), "w-full")}>
			{#each subsystems as sub (sub.name)}
				{@const Icon = getIcon(sub.name)}
				{@const label = stateToLabel(sub.state, sub.latencyMs)}
				<div
					class={cn(
						box({ paddingX: "12", paddingY: "6" }),
						"rounded-md",
						sub.state === "skipped" && "opacity-50",
					)}
					data-kind="box"
					data-slot="root"
				>
					<div class={hstack({ gap: "12", align: "center" })}>
						<Badge
							variant={stateToVariant(sub.state)}
							size="sm"
							decorative
							class="h-2 w-2 min-w-0 p-0"
						>
							&ZeroWidthSpace;
						</Badge>
						{#if Icon}
							{@const IconComponent = Icon}
							<IconComponent size={14} class="shrink-0 text-text-muted" />
						{/if}
						<Text size="sm" color={sub.state === "skipped" ? "muted" : "secondary"} class="flex-1">
							{DEV_MODE ? devLabel(sub.name) : resolveLabel(sub.name)}
						</Text>
						{#if label}
							<Text size="xs" color="muted">{label}</Text>
						{/if}
					</div>
				</div>
			{/each}

			{#if subsystems.length === 0}
				<Text size="xs" color="muted">Waiting for engine to start...</Text>
			{/if}
		</div>

		<!-- Progress bar -->
		<Progress
			value={platformState.progress}
			max={100}
			size="sm"
			class="w-full"
		/>

		<!-- Elapsed time -->
		{#if platformState.isBooting}
			<Text size="xs" color="muted">{platformState.bootElapsedFormatted} elapsed</Text>
		{/if}

		<!-- Error state -->
		{#if platformState.hasFailed && platformState.error}
			<div
				class={cn(
					box({ paddingX: "12", paddingY: "8" }),
					"w-full text-center rounded-md border border-[var(--signal-error)]/20 bg-[var(--signal-error)]/10",
				)}
				data-kind="box"
				data-slot="root"
			>
				<Text size="xs" color="accent">{platformState.error}</Text>
			</div>
		{/if}
	</div>
</div>
{/if}
