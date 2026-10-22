<!--
  @file src/lib/layouts/app/StatusBar.svelte
  @module @devpulse/layouts/app/StatusBar
  @layer lib

  Status bar with progressive boot display.
  During boot: shows per-subsystem status with latencies and icons.
  After boot: shows connection status, uptime, version.
  DEV_MODE: raw tech labels (Turso, SurrealDB, DuckDB, Moka).
  PROD: friendly labels (Data Store, Cortex, Analytics Engine, Memory Cache).

  Per-subsystem details — tech name, category, Clyffy narration — live
  inside <SubsystemBadge /> (tooltip on hover).

  @consumers
  - Frame.svelte: Main app layout

  @since 1.0.0

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
import { Badge } from "@devpulse/coldlight/components/badge";
import { Text } from "@devpulse/coldlight/components/text";
import { hstack } from "@devpulse/coldlight/utils";
import {
	formatMb,
	hardwareState,
	isInferenceReady,
	modelsState,
} from "$lib/domains/app/models/index.js";
import { DEV_MODE } from "$lib/sys/generated/terminology.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";
import { groupSubsystems } from "./StatusBar.types.js";
import SubsystemBadge from "./SubsystemBadge.svelte";

const APP_VERSION = "0.1.0";

const subsystems = $derived(platformState.subsystemList());
const brainStatus = $derived(modelsState.statuses["chat.brain"]);
const brainLoaded = $derived(brainStatus !== undefined && isInferenceReady(brainStatus));
const subsystemGroups = $derived(groupSubsystems(subsystems));

// Subscribe to live hardware telemetry so the VRAM badge has real data.
// Ref-counted via createTauriEvent — shared with dashboard and any other
// active subscriber; detaches automatically when StatusBar unmounts.
$effect(() => hardwareState.subscribe("statusbar"));
</script>

<div class="statusbar-surface flex w-full items-center justify-between" aria-label="System status">
	{#if platformState.isBooting}
		<!-- Boot progress mode — grouped subsystems with per-badge tooltips -->
		<div class={hstack({ gap: "2", align: "center" })}>
			{#if DEV_MODE}
				{#if subsystems.length === 0}
					<Text size="xs" color="muted">Initializing...</Text>
				{:else}
					{#each subsystemGroups as group (group.label)}
						<span class="group-separator" aria-hidden="true"></span>
						<Text size="xs" color="muted" class="group-label">{group.label}</Text>
						{#each group.subs as sub (sub.name)}
							<SubsystemBadge subsystem={sub} groupKind={group.kind} />
						{/each}
					{/each}
				{/if}
			{:else}
				<Text size="xs" color="secondary">
					{#if platformState.progress >= 100}
						All systems operational
					{:else}
						Starting up... {subsystems.filter(s => s.state === 'ready').length} of {Math.max(4, subsystems.length)} systems ready
					{/if}
				</Text>
			{/if}
		</div>

		<div class={hstack({ gap: "2", align: "center" })}>
			<Badge variant="neutral" size="sm">
				<Text size="xs" color="muted">{platformState.progress}%</Text>
			</Badge>
		</div>
	{:else if platformState.hasFailed}
		<!-- Boot failed -->
		<div class={hstack({ gap: "2", align: "center" })}>
			<Badge variant="negative" size="sm" class="gap-1.5">
				<span class="status-dot h-2 w-2 rounded-full" data-status="offline" aria-hidden="true"></span>
				<Text size="xs" color="accent">Boot failed</Text>
			</Badge>
			{#if platformState.error}
				<Text size="xs" color="muted">{platformState.error}</Text>
			{/if}
		</div>
	{:else}
		<!-- Health display mode (post-boot) -->
		<div class={hstack({ gap: "2", align: "center" })}>
			<Badge
				variant="neutral"
				size="sm"
				class="gap-1.5"
				data-status={platformState.connectionStatus}
			>
				<span
					class="status-dot h-2 w-2 rounded-full"
					data-status={platformState.connectionStatus}
					aria-hidden="true"
				></span>
				<Text size="xs" color="secondary">{platformState.connectionStatus}</Text>
			</Badge>

			<!-- Model status segment -->
			<Badge variant={brainLoaded ? "positive" : "neutral"} size="sm" class="gap-1">
				<span
					class="status-dot h-1.5 w-1.5 rounded-full"
					data-subsystem-state={brainLoaded ? "ready" : "pending"}
					aria-hidden="true"
				></span>
				<Text size="xs" color="secondary">Brain: {brainLoaded ? "ON" : "OFF"}</Text>
			</Badge>
			{#if hardwareState.hasGpu}
				<Badge variant="neutral" size="sm">
					<Text size="xs" color="muted">VRAM: {formatMb(hardwareState.vramUsedMb ?? 0)}/{formatMb(hardwareState.vramTotalMb ?? 0)}</Text>
				</Badge>
			{/if}

			{#if DEV_MODE}
				{#each subsystemGroups as group (group.label)}
					<span class="group-separator" aria-hidden="true"></span>
					<Text size="xs" color="muted" class="group-label">{group.label}</Text>
					{#each group.subs as sub (sub.name)}
						<SubsystemBadge subsystem={sub} groupKind={group.kind} />
					{/each}
				{/each}
			{/if}
		</div>

		<div class={hstack({ gap: "2", align: "center" })}>
			<Badge variant="neutral" size="sm">
				<Text size="xs" color="muted">Uptime: {platformState.uptimeFormatted}</Text>
			</Badge>
			<Badge variant="neutral" size="sm">
				<Text size="xs" color="muted">v{APP_VERSION}</Text>
			</Badge>
		</div>
	{/if}
</div>

<style>
	.statusbar-surface {
		background: var(--glass-deep);
		backdrop-filter: blur(var(--blur-lg));
		-webkit-backdrop-filter: blur(var(--blur-lg));
		box-shadow: inset var(--bevel-subtle), var(--glow-dot-sm);
		border-radius: 0;
	}

	.status-dot {
		box-shadow: var(--glow-dot-sm);
	}
	.status-dot[data-status="online"] {
		background-color: var(--color-teal-400);
	}
	.status-dot[data-status="offline"] {
		background-color: var(--signal-error);
	}
	.status-dot[data-status="hybrid"] {
		background-color: var(--color-purple-400);
	}
	.status-dot[data-subsystem-state="ready"] {
		background-color: var(--color-teal-400);
	}
	.status-dot[data-subsystem-state="pending"] {
		background-color: var(--text-muted);
	}
	.group-separator {
		width: 0.0625rem;
		height: 1rem;
		background: var(--border-soft);
		flex-shrink: 0;
	}

	:global(.group-label) {
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-size: 0.5625rem;
		opacity: 0.6;
		flex-shrink: 0;
	}
</style>
