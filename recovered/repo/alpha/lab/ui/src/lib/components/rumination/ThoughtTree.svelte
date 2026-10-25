<script lang="ts">
	import { onMount } from 'svelte';
	import ThoughtNode from './ThoughtNode.svelte';
	import { ruminationStore } from '$lib/stores/rumination.svelte';

	onMount(() => {
		ruminationStore.startPolling();
		return () => ruminationStore.stopPolling();
	});
</script>

<div class="glass p-4">
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-sm font-medium text-gray-400">Thought Tree</h3>
		{#if ruminationStore.tree}
			<span class="text-xs text-gray-500">
				{ruminationStore.totalNodes} nodes
			</span>
		{/if}
	</div>

	{#if ruminationStore.loading && !ruminationStore.tree}
		<div class="text-center text-gray-500 py-8">Loading...</div>
	{:else if ruminationStore.tree?.root}
		<div class="max-h-[500px] overflow-auto custom-scrollbar">
			<ThoughtNode node={ruminationStore.tree.root} isSelected={false} />
		</div>
	{:else}
		<div class="text-center text-gray-500 py-8">
			<p>No active thought tree</p>
			<p class="text-xs mt-2">Start a chat session to see rumination in action</p>
		</div>
	{/if}
</div>
