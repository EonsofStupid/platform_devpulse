<script lang="ts">
	/**
	 * HardwareGauges - Real-time CPU/RAM/GPU gauges
	 * Uses hardwareStore for live metrics from Tauri backend
	 */
	import { onMount, onDestroy } from 'svelte';
	import { hardwareStore } from '$lib/stores/hardware.svelte';

	onMount(() => {
		hardwareStore.start();
	});

	onDestroy(() => {
		hardwareStore.stop();
	});

	// Color based on usage percentage
	function getColor(pct: number): string {
		if (pct >= 90) return '#ef4444'; // Red - critical
		if (pct >= 70) return '#f59e0b'; // Amber - warning
		return '#22c55e'; // Green - healthy
	}

	// SVG arc path for circular gauge
	function describeArc(pct: number): string {
		const radius = 40;
		const cx = 50;
		const cy = 50;
		const startAngle = -135;
		const endAngle = startAngle + (pct / 100) * 270;

		const start = polarToCartesian(cx, cy, radius, endAngle);
		const end = polarToCartesian(cx, cy, radius, startAngle);
		const largeArcFlag = pct > 50 ? 1 : 0;

		return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
	}

	function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
		const rad = ((angle - 90) * Math.PI) / 180;
		return {
			x: cx + r * Math.cos(rad),
			y: cy + r * Math.sin(rad)
		};
	}
</script>

<div class="hardware-gauges">
	<!-- CPU Gauge -->
	<div class="gauge-card">
		<div class="gauge-title">CPU USAGE</div>
		<div class="gauge-container">
			<svg viewBox="0 0 100 100" class="gauge-svg">
				<!-- Background arc -->
				<path class="gauge-bg" d={describeArc(100)} />
				<!-- Value arc -->
				<path
					class="gauge-value"
					d={describeArc(hardwareStore.cpuPct)}
					style="stroke: {getColor(hardwareStore.cpuPct)}"
				/>
			</svg>
			<div class="gauge-center">
				<span class="gauge-pct" style="color: {getColor(hardwareStore.cpuPct)}">
					{Math.round(hardwareStore.cpuPct)}%
				</span>
			</div>
		</div>
	</div>

	<!-- RAM Gauge -->
	<div class="gauge-card">
		<div class="gauge-title">RAM USAGE</div>
		<div class="gauge-container">
			<svg viewBox="0 0 100 100" class="gauge-svg">
				<path class="gauge-bg" d={describeArc(100)} />
				<path
					class="gauge-value"
					d={describeArc(hardwareStore.ramPct)}
					style="stroke: {getColor(hardwareStore.ramPct)}"
				/>
			</svg>
			<div class="gauge-center">
				<span class="gauge-value-text">
					{hardwareStore.ramUsedGb.toFixed(1)}
				</span>
				<span class="gauge-total">/{hardwareStore.ramTotalGb.toFixed(0)}GB</span>
			</div>
		</div>
	</div>

	<!-- GPU VRAM Gauge -->
	<div class="gauge-card" class:disabled={!hardwareStore.hasGpu}>
		<div class="gauge-title">GPU VRAM</div>
		<div class="gauge-container">
			<svg viewBox="0 0 100 100" class="gauge-svg">
				<path class="gauge-bg" d={describeArc(100)} />
				{#if hardwareStore.hasGpu}
					<path
						class="gauge-value"
						d={describeArc(hardwareStore.vramPct)}
						style="stroke: {getColor(hardwareStore.vramPct)}"
					/>
				{/if}
			</svg>
			<div class="gauge-center">
				{#if hardwareStore.hasGpu}
					<span class="gauge-value-text">
						{hardwareStore.vramUsedGb.toFixed(1)}
					</span>
					<span class="gauge-total">/{hardwareStore.vramTotalGb.toFixed(0)}GB</span>
				{:else}
					<span class="gauge-na">N/A</span>
				{/if}
			</div>
		</div>
		{#if hardwareStore.hasGpu}
			<div class="gpu-name">{hardwareStore.gpuName}</div>
		{/if}
	</div>
</div>

{#if hardwareStore.error}
	<div class="metrics-error">
		Failed to load metrics: {hardwareStore.error}
	</div>
{/if}

<style>
	.hardware-gauges {
		display: flex;
		gap: 1.5rem;
		justify-content: center;
		padding: 1rem;
	}

	.gauge-card {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 1rem;
		min-width: 140px;
		text-align: center;
	}

	.gauge-card.disabled {
		opacity: 0.5;
	}

	.gauge-title {
		font-size: 0.7rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.5);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}

	.gauge-container {
		position: relative;
		width: 100px;
		height: 100px;
		margin: 0 auto;
	}

	.gauge-svg {
		width: 100%;
		height: 100%;
		transform: rotate(0deg);
	}

	.gauge-bg {
		fill: none;
		stroke: rgba(255, 255, 255, 0.1);
		stroke-width: 8;
		stroke-linecap: round;
	}

	.gauge-value {
		fill: none;
		stroke-width: 8;
		stroke-linecap: round;
		transition: stroke 0.3s ease;
	}

	.gauge-center {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
	}

	.gauge-pct {
		font-size: 1.5rem;
		font-weight: 700;
		transition: color 0.3s ease;
	}

	.gauge-value-text {
		display: block;
		font-size: 1.25rem;
		font-weight: 700;
		color: #fff;
	}

	.gauge-total {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.gauge-na {
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.3);
	}

	.gpu-name {
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.4);
		margin-top: 0.5rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 120px;
	}

	.metrics-error {
		margin-top: 1rem;
		padding: 0.75rem;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 8px;
		color: #ef4444;
		font-size: 0.8rem;
		text-align: center;
	}
</style>
