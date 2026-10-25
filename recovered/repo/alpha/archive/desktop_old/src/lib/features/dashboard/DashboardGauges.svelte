<script lang="ts">
	/**
	 * DashboardGauges - System overview gauges for dashboard
	 * Shows VRAM, Context, Tokens/sec in circular gauges
	 */
	import { onMount, onDestroy } from "svelte";
	import { hardwareStore } from "$lib/stores/hardware.svelte";

	onMount(() => {
		hardwareStore.start();
	});

	onDestroy(() => {
		hardwareStore.stop();
	});

	// Mock data for context and tokens (will be wired to real metrics)
	let contextUsed = $state(2700);
	let contextTotal = $state(4096);
	let tokensPerSec = $state(1200);

	// Derived values
	let contextPct = $derived((contextUsed / contextTotal) * 100);
	let vramPct = $derived(hardwareStore.vramPct);

	// SVG arc path for circular gauge
	function describeArc(pct: number): string {
		const radius = 45;
		const cx = 55;
		const cy = 55;
		const startAngle = -135;
		const endAngle = startAngle + (pct / 100) * 270;

		const start = polarToCartesian(cx, cy, radius, endAngle);
		const end = polarToCartesian(cx, cy, radius, startAngle);
		const largeArcFlag = pct > 50 ? 1 : 0;

		return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
	}

	function polarToCartesian(
		cx: number,
		cy: number,
		r: number,
		angle: number,
	) {
		const rad = ((angle - 90) * Math.PI) / 180;
		return {
			x: cx + r * Math.cos(rad),
			y: cy + r * Math.sin(rad),
		};
	}

	function getGaugeColor(
		pct: number,
		type: "vram" | "context" | "speed",
	): string {
		if (type === "speed") return "#22c55e"; // Speed is always green
		if (pct >= 90) return "#ef4444";
		if (pct >= 70) return "#f59e0b";
		return "#6366f1";
	}
</script>

<div class="dashboard-gauges">
	<h3 class="section-title">SYSTEM OVERVIEW</h3>

	<div class="gauges-row">
		<!-- VRAM Gauge -->
		<div class="gauge-card">
			<svg viewBox="0 0 110 110" class="gauge-svg">
				<path class="gauge-bg" d={describeArc(100)} />
				<path
					class="gauge-value"
					d={describeArc(vramPct)}
					style="stroke: {getGaugeColor(vramPct, 'vram')}"
				/>
			</svg>
			<div class="gauge-center">
				<span class="gauge-main"
					>{hardwareStore.vramUsedGb.toFixed(1)}GB</span
				>
				<span class="gauge-sub"
					>/{hardwareStore.vramTotalGb.toFixed(0)}GB</span
				>
			</div>
			<span class="gauge-label">VRAM</span>
			<span
				class="gauge-pct"
				style="color: {getGaugeColor(vramPct, 'vram')}"
				>{Math.round(vramPct)}%</span
			>
		</div>

		<!-- Context Gauge -->
		<div class="gauge-card">
			<svg viewBox="0 0 110 110" class="gauge-svg">
				<path class="gauge-bg" d={describeArc(100)} />
				<path
					class="gauge-value"
					d={describeArc(contextPct)}
					style="stroke: {getGaugeColor(contextPct, 'context')}"
				/>
			</svg>
			<div class="gauge-center">
				<span class="gauge-main">{Math.round(contextPct)}%</span>
			</div>
			<span class="gauge-label">CONTEXT</span>
			<span class="gauge-detail"
				>{contextUsed.toLocaleString()}/{contextTotal.toLocaleString()}</span
			>
		</div>

		<!-- Tokens/sec Gauge -->
		<div class="gauge-card">
			<svg viewBox="0 0 110 110" class="gauge-svg">
				<path class="gauge-bg" d={describeArc(100)} />
				<path
					class="gauge-value"
					d={describeArc(75)}
					style="stroke: #22c55e"
				/>
			</svg>
			<div class="gauge-center">
				<span class="gauge-main"
					>{(tokensPerSec / 1000).toFixed(1)}k</span
				>
				<span class="gauge-sub">/sec</span>
			</div>
			<span class="gauge-label">TOKENS</span>
			<span class="gauge-detail">Speed</span>
		</div>
	</div>
</div>

<style>
	.dashboard-gauges {
		padding: 1.5rem;
	}

	.section-title {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: rgba(255, 255, 255, 0.4);
		margin: 0 0 1rem 0;
		text-align: center;
	}

	.gauges-row {
		display: flex;
		justify-content: center;
		gap: 2rem;
		flex-wrap: wrap;
	}

	.gauge-card {
		position: relative;
		width: 140px;
		height: 160px;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.gauge-svg {
		width: 100px;
		height: 100px;
	}

	.gauge-bg {
		fill: none;
		stroke: rgba(255, 255, 255, 0.08);
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
		top: 50px;
		left: 50%;
		transform: translateX(-50%);
		text-align: center;
	}

	.gauge-main {
		display: block;
		font-size: 1.25rem;
		font-weight: 700;
		color: #fff;
		font-family: "JetLlms Mono", "Fira Code", monospace;
	}

	.gauge-sub {
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.4);
	}

	.gauge-label {
		margin-top: auto;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		color: rgba(255, 255, 255, 0.6);
	}

	.gauge-pct {
		font-size: 0.75rem;
		font-weight: 600;
		margin-top: 0.15rem;
	}

	.gauge-detail {
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.4);
		margin-top: 0.15rem;
	}
</style>
