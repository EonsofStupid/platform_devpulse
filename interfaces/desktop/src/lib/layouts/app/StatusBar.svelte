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
-->
<script lang="ts">
import { platformState } from "$lib/sys/runes/platformState.svelte.js";
import { DEV_MODE, resolveLabel, devLabel } from "$lib/sys/generated/terminology.js";
import { getIcon } from "$lib/sys/generated/terminology-icons.js";
import { Badge } from "$lib/design/components/badge/index.js";
import { HStack } from "$lib/design/components/hstack/index.js";
import { Text } from "$lib/design/components/text/index.js";

const APP_VERSION = "0.1.0";

const subsystems = $derived(platformState.subsystemList());
</script>

<div class="flex w-full items-center justify-between" aria-label="System status">
	{#if platformState.isBooting}
		<!-- Boot progress mode -->
		<HStack gap="2" align="center">
			{#if DEV_MODE}
				{#each subsystems as sub}
					{@const Icon = getIcon(sub.name)}
					<Badge
						intent="default"
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
		</HStack>

		<HStack gap="2" align="center">
			<Badge intent="default" size="sm">
				<Text size="xs" color="muted">{platformState.progress}%</Text>
			</Badge>
		</HStack>
	{:else if platformState.hasFailed}
		<!-- Boot failed -->
		<HStack gap="2" align="center">
			<Badge intent="error" size="sm" class="gap-1.5">
				<span class="status-dot h-2 w-2 rounded-full" data-status="offline" aria-hidden="true"></span>
				<Text size="xs" color="accent">Boot failed</Text>
			</Badge>
			{#if platformState.error}
				<Text size="xs" color="muted">{platformState.error}</Text>
			{/if}
		</HStack>
	{:else}
		<!-- Health display mode (post-boot) -->
		<HStack gap="2" align="center">
			<Badge
				intent="default"
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
					<HStack gap="1" align="center">
						{#if Icon}
							{@const IconComponent = Icon}
							<IconComponent size={12} class="shrink-0 text-text-muted" />
						{/if}
						<Text size="xs" color="muted">
							[{devLabel(sub.name)}: {sub.state}{sub.latencyMs !== null ? ` ${sub.latencyMs}ms` : ''}]
						</Text>
					</HStack>
				{/each}
			{/if}
		</HStack>

		<HStack gap="2" align="center">
			<Badge intent="default" size="sm">
				<Text size="xs" color="muted">Uptime: {platformState.uptimeFormatted}</Text>
			</Badge>
			<Badge intent="default" size="sm">
				<Text size="xs" color="muted">v{APP_VERSION}</Text>
			</Badge>
		</HStack>
	{/if}
</div>

<style>
	.status-dot {
		box-shadow: 0 0 6px currentColor;
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
