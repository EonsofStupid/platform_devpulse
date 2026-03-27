<!--
  @file src/lib/layouts/app/StatusBar.svelte
  @module @devpulse/layouts/app/StatusBar
  @layer lib

  Status bar with progressive boot display.
  During boot: shows per-subsystem status with latencies and icons.
  After boot: shows connection status, uptime, version.
  DEV_MODE: raw tech labels (LibSQL, SurrealDB, DuckDB, Moka).
  PROD: friendly labels (Data Store, Cortex, Analytics Engine, Memory Cache).

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
import { Badge } from "$lib/design/components/badge/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { DEV_MODE, devLabel, resolveLabel } from "$lib/sys/generated/terminology.js";
import { getIcon } from "$lib/sys/generated/terminology-icons.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";

const APP_VERSION = "0.1.0";

const subsystems = $derived(platformState.subsystemList());
</script>

<div class="flex w-full items-center justify-between" aria-label="System status">
	{#if platformState.isBooting}
		<!-- Boot progress mode -->
		<div class={hstack({ gap: "2", align: "center" })}>
			{#if DEV_MODE}
				{#each subsystems as sub}
					{@const Icon = getIcon(sub.name)}
					<Badge
						variant="neutral"
						size="sm"
						class="gap-1"
						data-subsystem-state={sub.state}
					>
						<span
							class="status-dot h-1.5 w-1.5 rounded-full"
							data-subsystem-state={sub.state}
							aria-hidden="true"
						></span>
						{#if Icon}
							{@const IconComponent = Icon}
							<IconComponent size={12} class="shrink-0" />
						{/if}
						<Text size="xs" color="secondary">
							{devLabel(sub.name)}: {sub.state}{sub.latencyMs !== null ? ` ${sub.latencyMs}ms` : ''}
						</Text>
					</Badge>
				{/each}
				{#if subsystems.length === 0}
					<Text size="xs" color="muted">Initializing...</Text>
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

			{#if DEV_MODE}
				{#each subsystems as sub}
					{@const Icon = getIcon(sub.name)}
					<div class={hstack({ gap: "1", align: "center" })}>
						{#if Icon}
							{@const IconComponent = Icon}
							<IconComponent size={12} class="shrink-0 text-text-muted" />
						{/if}
						<Text size="xs" color="muted">
							[{devLabel(sub.name)}: {sub.state}{sub.latencyMs !== null ? ` ${sub.latencyMs}ms` : ''}]
						</Text>
					</div>
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
	.status-dot {
		box-shadow: 0 0 0.375rem currentColor;
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
	.status-dot[data-subsystem-state="loading"] {
		background-color: var(--color-purple-400);
		animation: pulse 1s ease-in-out infinite;
	}
	.status-dot[data-subsystem-state="ready"] {
		background-color: var(--color-teal-400);
	}
	.status-dot[data-subsystem-state="failed"] {
		background-color: var(--signal-error);
	}
	.status-dot[data-subsystem-state="pending"] {
		background-color: var(--text-muted);
	}
	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.4; }
	}
</style>
