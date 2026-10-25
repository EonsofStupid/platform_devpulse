<script lang="ts">
	/**
	 * StatusBar - 52px fixed bottom bar with system vitals
	 *
	 * Shows:
	 * - System health indicator (green/yellow/red)
	 * - VRAM usage
	 * - Active llm model name
	 * - Guardian/monitoring status
	 * - Network status
	 */
	import { onMount, onDestroy } from "svelte";
	import { hardwareStore } from "$lib/stores/hardware.svelte";
	import { statusStore } from "$lib/stores";

	// Start polling hardware metrics
	onMount(() => {
		hardwareStore.start();
	});

	onDestroy(() => {
		hardwareStore.stop();
	});

	// System health based on resource usage
	type HealthStatus = "healthy" | "warning" | "critical";

	let systemHealth = $derived<HealthStatus>(
		hardwareStore.vramPct >= 95 ||
			hardwareStore.ramPct >= 95 ||
			hardwareStore.cpuPct >= 95
			? "critical"
			: hardwareStore.vramPct >= 80 ||
				  hardwareStore.ramPct >= 80 ||
				  hardwareStore.cpuPct >= 80
				? "warning"
				: "healthy",
	);

	let healthLabel = $derived(
		systemHealth === "critical"
			? "Critical"
			: systemHealth === "warning"
				? "Warning"
				: "System OK",
	);

	// Active model (placeholder - will come from modelsStore)
	let activeModel = $derived(
		statusStore.aiReady ? "qwen3-vl-8b" : "No Model",
	);

	// Guardian status
	let guardianActive = $state(true);
</script>

<footer class="status-bar">
	<!-- System Health -->
	<div class="status-section health">
		<span
			class="health-indicator"
			class:healthy={systemHealth === "healthy"}
			class:warning={systemHealth === "warning"}
			class:critical={systemHealth === "critical"}
		></span>
		<span class="status-label">{healthLabel}</span>
	</div>

	<div class="divider"></div>

	<!-- VRAM -->
	<div class="status-section vram">
		<span class="status-icon">💾</span>
		<span class="status-value">
			VRAM {hardwareStore.vramUsedGb.toFixed(
				1,
			)}/{hardwareStore.vramTotalGb.toFixed(0)}GB
		</span>
	</div>

	<div class="divider"></div>

	<!-- Active Llm Model -->
	<div class="status-section model">
		<span class="status-icon">🧠</span>
		<span class="status-label">Llm:</span>
		<span class="status-value model-name">{activeModel}</span>
	</div>

	<div class="divider"></div>

	<!-- Guardian Status -->
	<div class="status-section guardian" class:active={guardianActive}>
		<span class="status-icon">🛡️</span>
		<span class="status-label">Guardian:</span>
		<span class="status-value"
			>{guardianActive ? "Active" : "Inactive"}</span
		>
	</div>

	<!-- Spacer -->
	<div class="spacer"></div>

	<!-- Network Status -->
	<div class="status-section network">
		<span class="network-indicator online"></span>
	</div>
</footer>

<style>
	.status-bar {
		position: fixed;
		bottom: 0;
		left: 52px; /* Account for IconSidebar */
		right: 0;
		height: 52px;
		display: flex;
		align-items: center;
		padding: 0 1rem;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(12px);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		z-index: 100;
		gap: 0.5rem;
	}

	.status-section {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0 0.5rem;
	}

	.status-icon {
		font-size: 0.875rem;
	}

	.status-label {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.status-value {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.8);
		font-weight: 500;
	}

	.divider {
		width: 1px;
		height: 24px;
		background: rgba(255, 255, 255, 0.1);
	}

	.spacer {
		flex: 1;
	}

	/* Health Indicator */
	.health-indicator {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #666;
	}

	.health-indicator.healthy {
		background: #22c55e;
		box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
	}

	.health-indicator.warning {
		background: #f59e0b;
		box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
		animation: pulse 1.5s ease-in-out infinite;
	}

	.health-indicator.critical {
		background: #ef4444;
		box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
		animation: pulse 0.75s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	/* VRAM Section */
	.vram .status-value {
		font-family: "JetLlms Mono", "Fira Code", monospace;
		font-size: 0.7rem;
	}

	/* Model Section */
	.model-name {
		color: #a78bfa;
		max-width: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Guardian Section */
	.guardian.active .status-value {
		color: #22c55e;
	}

	/* Network Indicator */
	.network-indicator {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #666;
	}

	.network-indicator.online {
		background: #22c55e;
	}

	.network-indicator.offline {
		background: #ef4444;
	}
</style>
