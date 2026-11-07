<script lang="ts">
	import { backgroundStore } from '$lib/stores/background.svelte';

	const statusColors: Record<string, string> = {
		idle: 'border-gray-600 bg-gray-800/50',
		working: 'border-green-500 bg-green-500/10',
		error: 'border-red-500 bg-red-500/10'
	};

	const statusText: Record<string, string> = {
		idle: 'text-gray-400',
		working: 'text-green-400',
		error: 'text-red-400'
	};
</script>

<div class="glass p-4">
	<h3 class="text-sm font-medium text-gray-400 mb-3">Minions</h3>

	{#if backgroundStore.minions.length === 0}
		<div class="text-center text-gray-500 py-4">No minions configured</div>
	{:else}
		<div class="grid grid-cols-2 gap-2">
			{#each backgroundStore.minions as minion (minion.id)}
				<div class="p-3 rounded-lg border {statusColors[minion.status]}">
					<div class="flex items-center justify-between mb-1">
						<span class="text-sm font-medium text-white">{minion.name}</span>
						<span class="text-xs {statusText[minion.status]}">{minion.status}</span>
					</div>
					{#if minion.current_task}
						<div class="text-xs text-gray-500 truncate">{minion.current_task}</div>
					{:else}
						<div class="text-xs text-gray-600">Ready</div>
					{/if}
					<div class="text-[10px] text-gray-600 mt-1">{minion.tasks_completed} completed</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
