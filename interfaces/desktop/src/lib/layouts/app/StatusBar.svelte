<!--
  @file src/lib/layouts/app/StatusBar.svelte
  @module @devpulse/layouts/app/StatusBar
  @layer lib

  @description
  Status bar with progressive boot display.
  During boot: shows per-subsystem status with latencies.
  After boot: shows connection status, uptime, version.

  @consumers
  - Frame.svelte: Main app layout

  @since 1.0.0
-->
<script lang="ts">
import { platformState } from "$lib/sys/runes/platformState.svelte.js";
import { flags } from "$lib/sys/cfg/flags.js";

const APP_VERSION = "0.1.0";

const subsystems = $derived(platformState.subsystemList());
</script>

<div class="flex w-full items-center justify-between" aria-label="System status">
	{#if platformState.isBooting}
		<!-- Boot progress mode -->
		<div class="flex items-center gap-2">
			{#if flags.DEV_MODE}
				<!-- Dev mode: per-subsystem detail -->
				{#each subsystems as sub}
					<span
						data-kind="badge"
						data-slot="root"
						class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
						data-subsystem-state={sub.state}
					>
						<span
							class="status-dot h-1.5 w-1.5 rounded-full"
							data-subsystem-state={sub.state}
							aria-hidden="true"
						></span>
						<span class="text-[var(--text-secondary)]">
							{sub.name}: {sub.state}{sub.latencyMs !== null ? ` ${sub.latencyMs}ms` : ''}
						</span>
					</span>
				{/each}
				{#if subsystems.length === 0}
					<span class="text-xs text-[var(--text-muted)]">Initializing...</span>
				{/if}
			{:else}
				<!-- Prod mode: clean progress -->
				<span class="text-xs text-[var(--text-secondary)]">
					{#if platformState.progress >= 100}
						All systems operational
					{:else}
						Starting up... {subsystems.filter(s => s.state === 'ready').length} of {Math.max(4, subsystems.length)} systems ready
					{/if}
				</span>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<span
				data-kind="badge"
				data-slot="root"
				class="inline-flex items-center rounded-full px-2 py-0.5 text-xs text-[var(--text-muted)]"
			>
				{platformState.progress}%
			</span>
		</div>
	{:else if platformState.hasFailed}
		<!-- Boot failed -->
		<div class="flex items-center gap-2">
			<span
				data-kind="badge"
				data-slot="root"
				class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs"
			>
				<span class="status-dot h-2 w-2 rounded-full" data-status="offline" aria-hidden="true"></span>
				<span class="text-[var(--signal-error)]">Boot failed</span>
			</span>
			{#if platformState.error}
				<span class="text-xs text-[var(--text-muted)]">{platformState.error}</span>
			{/if}
		</div>
	{:else}
		<!-- Health display mode (post-boot) -->
		<div class="flex items-center gap-2">
			<span
				data-kind="badge"
				data-slot="root"
				class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs"
				data-status={platformState.connectionStatus}
			>
				<span
					class="status-dot h-2 w-2 rounded-full"
					data-status={platformState.connectionStatus}
					aria-hidden="true"
				></span>
				<span class="text-[var(--text-secondary)]">{platformState.connectionStatus}</span>
			</span>

			{#if flags.DEV_MODE}
				<!-- Dev mode: show individual store health after boot -->
				{#each subsystems as sub}
					<span class="text-xs text-[var(--text-muted)]">
						[{sub.friendlyName}: {sub.state}{sub.latencyMs !== null ? ` ${sub.latencyMs}ms` : ''}]
					</span>
				{/each}
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<span
				data-kind="badge"
				data-slot="root"
				class="inline-flex items-center rounded-full px-2 py-0.5 text-xs text-[var(--text-muted)]"
			>
				Uptime: {platformState.uptimeFormatted}
			</span>

			<span
				data-kind="badge"
				data-slot="root"
				class="inline-flex items-center rounded-full px-2 py-0.5 text-xs text-[var(--text-muted)]"
			>
				v{APP_VERSION}
			</span>
		</div>
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
	/* Boot progress states */
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
