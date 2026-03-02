<!--
  @file src/lib/layouts/app/StatusBar.svelte
  @module @devpulse/layouts/app/StatusBar
  @layer lib

  @description
  Status bar. Connection dot, uptime, and version display.

  @consumers
  - Frame.svelte: Main app layout

  @since 1.0.0
-->
<script lang="ts">
import { platformHealth } from "$lib/sys/runes/health.svelte.js";

const APP_VERSION = "0.1.0";
</script>

<div class="flex w-full items-center justify-between" aria-label="System status">
	<div class="flex items-center gap-2">
		<span
			data-kind="badge"
			data-slot="root"
			class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs"
			data-status={platformHealth.connectionStatus}
		>
			<span
				class="status-dot h-2 w-2 rounded-full"
				data-status={platformHealth.connectionStatus}
				aria-hidden="true"
			></span>
			<span class="text-[var(--text-secondary)]">{platformHealth.connectionStatus}</span>
		</span>
	</div>

	<div class="flex items-center gap-2">
		<span
			data-kind="badge"
			data-slot="root"
			class="inline-flex items-center rounded-full px-2 py-0.5 text-xs text-[var(--text-muted)]"
		>
			Uptime: {platformHealth.uptimeFormatted}
		</span>

		<span
			data-kind="badge"
			data-slot="root"
			class="inline-flex items-center rounded-full px-2 py-0.5 text-xs text-[var(--text-muted)]"
		>
			v{APP_VERSION}
		</span>
	</div>
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
</style>
