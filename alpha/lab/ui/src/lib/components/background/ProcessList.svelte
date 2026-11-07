<script lang="ts">
	import { backgroundStore } from '$lib/stores/background.svelte';

	const healthColors: Record<string, string> = {
		healthy: 'text-green-400',
		degraded: 'text-amber-400',
		error: 'text-red-400'
	};

	const healthDots: Record<string, string> = {
		healthy: 'status-healthy',
		degraded: 'status-degraded',
		error: 'status-error'
	};
</script>

<div class="glass p-4">
	<h3 class="text-sm font-medium text-gray-400 mb-3">System Status</h3>

	{#if backgroundStore.status}
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<span class="text-gray-400">Status</span>
				<div class="flex items-center gap-2">
					<span class="status-dot {healthDots[backgroundStore.health]}"></span>
					<span class={healthColors[backgroundStore.health]}>
						{backgroundStore.health.charAt(0).toUpperCase() + backgroundStore.health.slice(1)}
					</span>
				</div>
			</div>

			<div class="flex items-center justify-between">
				<span class="text-gray-400">Uptime</span>
				<span class="mono text-white">{backgroundStore.uptime}</span>
			</div>

			<div class="flex items-center justify-between">
				<span class="text-gray-400">Active Minions</span>
				<span class="mono text-accent-blue">{backgroundStore.activeMinions}</span>
			</div>

			<div class="flex items-center justify-between">
				<span class="text-gray-400">Loaded Models</span>
				<span class="mono text-accent-purple">{backgroundStore.loadedModels.length}</span>
			</div>

			{#if backgroundStore.status.message}
				<div class="mt-2 p-2 bg-white/5 rounded text-xs text-gray-400">
					{backgroundStore.status.message}
				</div>
			{/if}
		</div>
	{:else}
		<div class="text-center text-gray-500 py-4">Loading...</div>
	{/if}
</div>
