<script lang="ts">
	import { signalStore } from '$lib/stores/signals.svelte';

	// Get latest inference signal
	const latestInference = $derived(() => {
		const inference = signalStore.signals.find((s) => s.signal_type === 'inference');
		if (!inference) return null;

		const payload = inference.payload as {
			tokens_in?: number;
			tokens_out?: number;
			latency_ms?: number;
			model_id?: string;
		};

		return {
			tokensIn: payload.tokens_in ?? 0,
			tokensOut: payload.tokens_out ?? 0,
			latencyMs: payload.latency_ms ?? 0,
			modelId: payload.model_id ?? 'unknown'
		};
	});
</script>

<div class="glass p-4">
	<h3 class="text-sm font-medium text-gray-400 mb-3">Inference Metrics</h3>

	{#if latestInference()}
		{@const metrics = latestInference()}
		<div class="grid grid-cols-2 gap-3">
			<div class="p-2 bg-white/5 rounded">
				<div class="text-xs text-gray-500">Tokens In</div>
				<div class="mono text-accent-blue">{metrics?.tokensIn}</div>
			</div>
			<div class="p-2 bg-white/5 rounded">
				<div class="text-xs text-gray-500">Tokens Out</div>
				<div class="mono text-accent-green">{metrics?.tokensOut}</div>
			</div>
			<div class="p-2 bg-white/5 rounded">
				<div class="text-xs text-gray-500">Latency</div>
				<div class="mono text-accent-amber">{metrics?.latencyMs}ms</div>
			</div>
			<div class="p-2 bg-white/5 rounded">
				<div class="text-xs text-gray-500">Model</div>
				<div class="text-xs text-white truncate">{metrics?.modelId}</div>
			</div>
		</div>
	{:else}
		<div class="text-center text-gray-500 py-4">No inference data yet</div>
	{/if}
</div>
