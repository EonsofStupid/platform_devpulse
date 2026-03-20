<!--
  @file BootOverlay.svelte
  @module @devpulse/layouts/app/BootOverlay

  Full-viewport overlay during platform boot.
  Shows per-subsystem progress with status indicators and latencies.
  Fades out and unmounts when boot completes.

  All layout via utils (hstack, stack, box → class strings).
  All visual via ColdLight components (Badge, Text, Progress).
-->
<script lang="ts">
import { Badge, type BadgeIntent } from "$lib/design/components/badge/index.js";
import { Progress } from "$lib/design/components/progress/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { box } from "$lib/design/utils/box/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { DEV_MODE, devLabel, resolveLabel } from "$lib/sys/generated/terminology.js";
import { getIcon } from "$lib/sys/generated/terminology-icons.js";
import type { SubsystemState } from "$lib/sys/runes/platformState.svelte.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";

let visible = $state(true);
let fading = $state(false);

const subsystems = $derived(platformState.subsystemList());

function stateToIntent(state: SubsystemState): BadgeIntent {
	switch (state) {
		case "ready": return "success";
		case "loading": return "info";
		case "failed": return "error";
		case "skipped": return "default";
		case "pending": return "default";
	}
}

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
		setTimeout(() => { visible = false; }, 600);
	}
});
</script>

{#if visible}
<div
	class={cn(
		"fixed inset-0 z-[9999] flex items-center justify-center",
		"bg-[var(--surface-base,#0a0a0f)]",
		"transition-opacity duration-500 ease-out",
		fading && "opacity-0 pointer-events-none",
	)}
	aria-label="Platform booting"
	role="status"
>
	<div class={cn(stack({ gap: "24", align: "center" }), "min-w-[320px] max-w-[400px] p-[var(--space-32)]")}>
		<!-- Wordmark -->
		<div class={stack({ gap: "4", align: "center" })}>
			<Text size="lg" weight="bold">DevPulse</Text>
			<div class={hstack({ gap: "8", align: "center", justify: "center" })}>
				<span
					class="inline-block w-1.5 h-1.5 rounded-full bg-[var(--glow-teal)] shrink-0 animate-pulse"
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
						"v-s0 v-b1 v-f1 rounded-md",
						sub.state === "skipped" && "opacity-50",
					)}
					data-kind="box"
					data-slot="root"
				>
					<div class={hstack({ gap: "12", align: "center" })}>
						<Badge
							intent={stateToIntent(sub.state)}
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
			surface="glass-void"
			glow="teal"
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
					"w-full text-center v-f1 rounded-md border border-[var(--color-red-500)]/20 bg-[var(--color-red-500)]/10",
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
