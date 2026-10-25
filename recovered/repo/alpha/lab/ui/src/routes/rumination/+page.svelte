<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import ThoughtTree from '$lib/components/rumination/ThoughtTree.svelte';
	import LayerIndicator from '$lib/components/rumination/LayerIndicator.svelte';
	import MinionPanel from '$lib/components/rumination/MinionPanel.svelte';
	import { ruminationStore } from '$lib/stores/rumination.svelte';

	onMount(() => {
		ruminationStore.startPolling(500); // Faster polling for rumination page
		return () => ruminationStore.stopPolling();
	});
</script>

<div class="flex flex-col h-full">
	<Header title="Rumination" />

	<div class="flex-1 p-6 overflow-auto">
		<!-- Status bar -->
		<div class="glass p-4 mb-6 flex items-center justify-between">
			<div class="flex items-center gap-4">
				{#if ruminationStore.isActive}
					<span class="status-dot status-healthy rumination-active"></span>
					<span class="text-green-400">Ruminating</span>
					{#if ruminationStore.currentLayer}
						<span class="text-gray-500">→</span>
						<span class="text-amber-400">{ruminationStore.currentLayer} layer</span>
					{/if}
				{:else}
					<span class="status-dot status-offline"></span>
					<span class="text-gray-400">Idle</span>
				{/if}
			</div>
			<div class="text-sm text-gray-500">
				{ruminationStore.totalNodes} thought nodes
			</div>
		</div>

		<!-- Layer indicators -->
		<div class="mb-6">
			<LayerIndicator />
		</div>

		<div class="grid grid-cols-3 gap-6">
			<!-- Thought tree (2 cols) -->
			<div class="col-span-2">
				<ThoughtTree />
			</div>

			<!-- Minion panel -->
			<div>
				<MinionPanel />
			</div>
		</div>
	</div>
</div>
