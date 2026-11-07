<script lang="ts">
	/**
	 * Statusbar - Bottom bar with Maestro/VRAM/Community vitals
	 * Per spec: MAESTRO: IDLE | VRAM: 8.2GB | Community: 4 Online
	 */
	import { statusStore, modelsStore } from "$lib/stores";
	import { connectionsStore } from "$lib/stores/connections.svelte";

	// Maestro status from connections store
	const maestro = $derived(connectionsStore.maestro);

	// VRAM from loaded model
	const vramGb = $derived(modelsStore.loadedVlModel?.vram_gb ?? 0);
	const vramDisplay = $derived(vramGb > 0 ? `${vramGb.toFixed(1)}GB` : "0GB");

	// Uptime formatted
	const uptime = $derived(() => {
		const secs = statusStore.uptime;
		const hours = Math.floor(secs / 3600);
		const mins = Math.floor((secs % 3600) / 60);
		return `${hours}h ${mins}m`;
	});

	// Community count (placeholder - will wire to Supabase later)
	let communityOnline = $state(0);
</script>

<footer class="statusbar glass-bar-bottom glass-tint-blue">
	<div class="status-left">
		<!-- Maestro Status -->
		<div
			class="status-block maestro"
			class:active={maestro.state === "connected"}
		>
			<span class="status-icon">🧠</span>
			<span class="status-label">MAESTRO</span>
			<span
				class="status-value"
				class:connected={maestro.state === "connected"}
				class:loading={maestro.state === "connecting"}
			>
				{#if maestro.state === "connected"}
					ACTIVE
				{:else if maestro.state === "connecting"}
					LOADING
				{:else}
					IDLE
				{/if}
			</span>
		</div>

		<div class="status-divider"></div>

		<!-- VRAM Usage -->
		<div class="status-block vram">
			<span class="status-icon">💾</span>
			<span class="status-label">VRAM</span>
			<span class="status-value">{vramDisplay}</span>
		</div>

		<div class="status-divider"></div>

		<!-- Uptime -->
		<div class="status-block uptime">
			<span class="status-icon">⏱️</span>
			<span class="status-label">UPTIME</span>
			<span class="status-value">{uptime()}</span>
		</div>
	</div>

	<div class="status-right">
		<!-- Community Status -->
		<div class="status-block community" class:active={communityOnline > 0}>
			<span class="status-icon">🌍</span>
			<span class="status-label">COMMUNITY</span>
			<span class="status-value">{communityOnline} Online</span>
		</div>

		<!-- Engine Health -->
		<div class="status-indicator">
			<span class="status-dot" class:healthy={statusStore.aiReady}></span>
			<span class="status-text"
				>{statusStore.aiReady
					? "Engine Online"
					: "Engine Offline"}</span
			>
		</div>
	</div>
</footer>

<style>
	.statusbar {
		height: var(--dp-statusbar-height, 36px);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 var(--dp-space-4);

		/* Local tint for statusbar */
		--glass-tint: var(--glass-hue-indigo, 250);

		/* Explicit glass styling */
		background: oklch(8% 0.03 var(--glass-tint) / 0.9);
		backdrop-filter: blur(20px) saturate(180%);
		-webkit-backdrop-filter: blur(20px) saturate(180%);
		border-top: 2px solid oklch(50% 0.12 var(--glass-tint) / 0.4);
		box-shadow:
			0 -4px 16px oklch(0% 0 0 / 0.4),
			inset 0 1px 1px oklch(75% 0.08 var(--glass-tint) / 0.25);
	}

	.status-left,
	.status-right {
		display: flex;
		align-items: center;
		gap: var(--dp-space-4);
	}

	/* Status Block - consistent layout */
	.status-block {
		display: flex;
		align-items: center;
		gap: var(--dp-space-2);
		padding: var(--dp-space-1) var(--dp-space-3);
		background: oklch(0% 0 0 / 0.3);
		border: 1px solid var(--dp-glass-border);
		border-radius: var(--dp-radius);
	}

	.status-block.active {
		border-color: oklch(from var(--dp-accent-primary) l c h / 0.5);
		box-shadow: 0 0 8px oklch(from var(--dp-accent-primary) l c h / 0.2);
	}

	.status-icon {
		font-size: 0.875rem;
	}

	.status-label {
		font-size: 0.625rem;
		font-weight: var(--dp-font-bold, 700);
		color: var(--dp-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.status-value {
		font-size: var(--dp-text-sm);
		font-weight: var(--dp-font-semibold, 600);
		color: var(--dp-text-primary);
		font-family: var(--dp-font-mono);
	}

	.status-value.connected {
		color: var(--dp-success);
		text-shadow: 0 0 8px oklch(from var(--dp-success) l c h / 0.5);
	}

	.status-value.loading {
		color: var(--dp-warning);
		animation: pulse-text 1s ease-in-out infinite;
	}

	@keyframes pulse-text {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.status-divider {
		width: 1px;
		height: 24px;
		background: var(--dp-glass-border);
	}

	/* Status Indicator (dot + text) */
	.status-indicator {
		display: flex;
		align-items: center;
		gap: var(--dp-space-2);
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: var(--dp-radius-full);
		background: var(--dp-error);
		transition: all var(--dp-transition-normal);
	}

	.status-dot.healthy {
		background: var(--dp-success);
		box-shadow: 0 0 10px oklch(from var(--dp-success) l c h / 0.6);
		animation: pulse-glow 2s ease-in-out infinite;
	}

	@keyframes pulse-glow {
		0%,
		100% {
			box-shadow: 0 0 10px oklch(from var(--dp-success) l c h / 0.6);
		}
		50% {
			box-shadow: 0 0 20px oklch(from var(--dp-success) l c h / 0.8);
		}
	}

	.status-text {
		font-size: var(--dp-text-xs);
		color: var(--dp-text-muted);
		font-weight: var(--dp-font-medium);
	}

	/* Specific block styling */
	.maestro.active .status-icon {
		animation: llm-pulse 2s ease-in-out infinite;
	}

	@keyframes llm-pulse {
		0%,
		100% {
			filter: drop-shadow(0 0 4px oklch(65% 0.2 280));
		}
		50% {
			filter: drop-shadow(0 0 12px oklch(70% 0.25 280));
		}
	}

	.community.active .status-value {
		color: var(--dp-success);
	}
</style>
