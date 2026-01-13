<script lang="ts">
	import { backgroundStore } from '$lib/stores/background.svelte';

	const statusColors: Record<string, string> = {
		idle: 'text-gray-400',
		working: 'text-green-400',
		error: 'text-red-400'
	};

	const statusDots: Record<string, string> = {
		idle: 'status-offline',
		working: 'status-healthy',
		error: 'status-error'
	};
</script>

<div class="glass p-4">
	<h3 class="text-sm font-medium text-gray-400 mb-3">Active Minions</h3>

	{#if backgroundStore.minions.length === 0}
		<div class="text-center text-gray-500 py-4">No minions active</div>
	{:else}
		<div class="space-y-2">
			{#each backgroundStore.minions as minion (minion.id)}
				<div class="flex items-center gap-3 p-2 rounded-lg bg-white/5">
					<span class="status-dot {statusDots[minion.status]}"></span>
					<div class="flex-1 min-w-0">
						<div class="text-sm font-medium text-white">{minion.name}</div>
						{#if minion.current_task}
							<div class="text-xs text-gray-500 truncate">{minion.current_task}</div>
						{/if}
					</div>
					<div class="text-xs {statusColors[minion.status]}">
						{minion.tasks_completed} tasks
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
