<script lang="ts">
	import { ruminationStore } from '$lib/stores/rumination.svelte';

	const layerColors: Record<string, string> = {
		keystroke: 'bg-blue-500',
		pause: 'bg-purple-500',
		send: 'bg-amber-500',
		background: 'bg-green-500'
	};

	const layerLabels: Record<string, string> = {
		keystroke: 'Keystroke',
		pause: 'Pause',
		send: 'Send',
		background: 'Background'
	};
</script>

<div class="glass p-4">
	<h3 class="text-sm font-medium text-gray-400 mb-3">Rumination Layers</h3>

	<div class="flex gap-2">
		{#each ruminationStore.layers as layer}
			<div
				class="flex-1 p-3 rounded-lg border transition-all {layer.active
					? `${layerColors[layer.name]} bg-opacity-20 border-current rumination-active`
					: 'bg-white/5 border-white/10'}"
			>
				<div class="text-xs font-medium {layer.active ? 'text-white' : 'text-gray-500'}">
					{layerLabels[layer.name] || layer.name}
				</div>
				<div class="text-lg font-bold mt-1 {layer.active ? 'text-white' : 'text-gray-400'}">
					{layer.thoughts_count}
				</div>
				{#if layer.latency_ms !== null}
					<div class="text-[10px] text-gray-500 mt-1">
						{layer.latency_ms}ms
					</div>
				{/if}
			</div>
		{/each}
	</div>

	{#if ruminationStore.layers.length === 0}
		<div class="text-center text-gray-500 py-4">No layer data</div>
	{/if}
</div>
