<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import ProcessList from '$lib/components/background/ProcessList.svelte';
	import MinionGrid from '$lib/components/background/MinionGrid.svelte';
	import ModelStatus from '$lib/components/background/ModelStatus.svelte';
	import { backgroundStore } from '$lib/stores/background.svelte';

	onMount(() => {
		backgroundStore.startPolling(1000); // Faster polling for this page
		return () => backgroundStore.stopPolling();
	});
</script>

<div class="flex flex-col h-full">
	<Header title="Background Processes" />

	<div class="flex-1 p-6 overflow-auto">
		<!-- Quick stats -->
		<div class="grid grid-cols-4 gap-4 mb-6">
			<div class="glass p-4">
				<div class="text-sm text-gray-400">Status</div>
				<div
					class="text-xl font-bold {backgroundStore.health === 'healthy'
						? 'text-green-400'
						: backgroundStore.health === 'degraded'
							? 'text-amber-400'
							: 'text-red-400'}"
				>
					{backgroundStore.health.charAt(0).toUpperCase() + backgroundStore.health.slice(1)}
				</div>
			</div>
			<div class="glass p-4">
				<div class="text-sm text-gray-400">Uptime</div>
				<div class="text-xl font-bold text-white mono">{backgroundStore.uptime}</div>
			</div>
			<div class="glass p-4">
				<div class="text-sm text-gray-400">Active Workers</div>
				<div class="text-xl font-bold text-accent-blue">
					{backgroundStore.activeMinions} / {backgroundStore.minions.length}
				</div>
			</div>
			<div class="glass p-4">
				<div class="text-sm text-gray-400">Total VRAM</div>
				<div class="text-xl font-bold text-accent-purple">
					{(backgroundStore.totalMemoryMb / 1024).toFixed(1)} GB
				</div>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-6">
			<!-- Left column -->
			<div class="space-y-4">
				<ProcessList />
				<MinionGrid />
			</div>

			<!-- Right column -->
			<div>
				<ModelStatus />
			</div>
		</div>

		{#if backgroundStore.error}
			<div class="mt-4 p-4 glass border-red-500/50 text-red-400">
				{backgroundStore.error}
			</div>
		{/if}
	</div>
</div>
