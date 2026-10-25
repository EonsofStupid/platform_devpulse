<!--
  @file LatencyTuningPanel.svelte
  Voice pipeline latency tuning. Content source, pipeline timing, buffer sizes.
  Colocated CSS. No renderForge.
-->
<script lang="ts">
import { Clock, Settings, Zap } from "lucide-svelte";

let contentSource = $state<"local" | "api" | "hybrid">("local");
let bufferMs = $state(200);
let vadSilenceMs = $state(500);
let streamChunkSize = $state(256);
let showAdvanced = $state(false);
</script>

<div class="latency-panel">
	<div class="header">
		<Clock size={20} class="icon" />
		<div>
			<h3 class="title">Latency Tuning</h3>
			<p class="subtitle">Control the speed vs quality tradeoff for voice interactions.</p>
		</div>
	</div>

	<!-- Content source -->
	<div class="section">
		<span class="section-title">Response Source</span>
		<div class="radio-group">
			<label class="radio-card" class:selected={contentSource === "local"}>
				<input type="radio" name="source" value="local" bind:group={contentSource} />
				<Zap size={16} />
				<div><span class="rl">Local Only</span><span class="rd">Fastest. All inference on your hardware.</span></div>
			</label>
			<label class="radio-card" class:selected={contentSource === "api"}>
				<input type="radio" name="source" value="api" bind:group={contentSource} />
				<Settings size={16} />
				<div><span class="rl">API Fallback</span><span class="rd">Falls back to cloud when local fails.</span></div>
			</label>
			<label class="radio-card" class:selected={contentSource === "hybrid"}>
				<input type="radio" name="source" value="hybrid" bind:group={contentSource} />
				<Zap size={16} />
				<div><span class="rl">Hybrid</span><span class="rd">Quick response local, deep reasoning via API.</span></div>
			</label>
		</div>
	</div>

	<!-- Sliders -->
	<div class="section">
		<span class="section-title">Audio Buffer</span>
		<div class="slider-row">
			<span class="sl">Buffer</span>
			<input type="range" class="range" min={50} max={1000} step={50} bind:value={bufferMs} />
			<span class="sv">{bufferMs}ms</span>
		</div>
		<p class="hint">Lower = faster response, higher = smoother audio. 200ms is recommended.</p>
	</div>

	<div class="section">
		<span class="section-title">Voice Activity Detection</span>
		<div class="slider-row">
			<span class="sl">Silence</span>
			<input type="range" class="range" min={200} max={2000} step={100} bind:value={vadSilenceMs} />
			<span class="sv">{vadSilenceMs}ms</span>
		</div>
		<p class="hint">How long to wait after you stop talking before processing. 500ms balances speed with complete sentences.</p>
	</div>

	{#if showAdvanced}
		<div class="section">
			<span class="section-title">Stream Chunk Size</span>
			<div class="slider-row">
				<span class="sl">Tokens</span>
				<input type="range" class="range" min={64} max={1024} step={64} bind:value={streamChunkSize} />
				<span class="sv">{streamChunkSize}</span>
			</div>
		</div>
	{/if}

	<button class="toggle" onclick={() => (showAdvanced = !showAdvanced)}>
		{showAdvanced ? "Hide" : "Show"} Advanced
	</button>
</div>

<style>
	.latency-panel { display:flex;flex-direction:column;gap:1rem;background:oklch(0.12 0.025 220/0.65);border:1px solid oklch(0.3 0.03 220/0.4);border-radius:0.75rem;padding:1.25rem;backdrop-filter:blur(12px); }
	.header { display:flex;align-items:flex-start;gap:0.75rem; }
	:global(.icon) { color:oklch(0.65 0.17 185); }
	.title { font-size:1rem;font-weight:700;color:oklch(0.93 0.015 224);margin:0; }
	.subtitle { font-size:0.8125rem;color:oklch(0.6 0.02 220);margin:0.25rem 0 0; }
	.section { display:flex;flex-direction:column;gap:0.5rem; }
	.section-title { font-size:0.8125rem;font-weight:700;color:oklch(0.75 0.02 220); }

	.radio-group { display:flex;flex-direction:column;gap:0.375rem; }
	.radio-card { display:flex;align-items:center;gap:0.75rem;padding:0.75rem;border-radius:0.5rem;border:1px solid oklch(0.3 0.02 220/0.4);background:oklch(0.15 0.02 220/0.3);cursor:pointer;color:oklch(0.6 0.02 220); }
	.radio-card.selected { border-color:oklch(0.65 0.17 185);background:oklch(0.15 0.03 185/0.2); }
	.radio-card input { accent-color:oklch(0.65 0.17 185); }
	.rl { display:block;font-size:0.875rem;font-weight:600;color:oklch(0.9 0.015 224); }
	.rd { display:block;font-size:0.875rem;color:oklch(0.55 0.02 220); }

	.slider-row { display:flex;align-items:center;gap:0.75rem; }
	.sl { font-size:0.8125rem;color:oklch(0.6 0.02 220);width:3.5rem; }
	.sv { font-size:0.8125rem;color:oklch(0.85 0.015 224);width:3.5rem;text-align:right; }
	.range { flex:1;accent-color:oklch(0.65 0.17 185); }
	.hint { font-size:0.875rem;color:oklch(0.5 0.02 220);margin:0; }

	.toggle { background:none;border:none;color:oklch(0.6 0.02 220);font-size:0.8125rem;cursor:pointer;padding:0; }
	.toggle:hover { color:oklch(0.75 0.02 220); }
</style>
