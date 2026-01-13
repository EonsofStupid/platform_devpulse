<script lang="ts">
	import { signalStore } from '$lib/stores/signals.svelte';

	const types = ['chat', 'inference', 'rumination', 'thought_node', 'debug'];

	const badgeClass: Record<string, string> = {
		chat: 'badge-chat',
		inference: 'badge-inference',
		rumination: 'badge-rumination',
		thought_node: 'badge-thought',
		debug: 'badge-debug'
	};
</script>

<div class="glass p-4">
	<div class="flex items-center gap-2 flex-wrap">
		<span class="text-sm text-gray-400 mr-2">Filter:</span>

		<button
			onclick={() => signalStore.setFilter(null)}
			class="px-3 py-1 text-sm rounded-full transition-all {signalStore.filter === null
				? 'bg-white/20 text-white'
				: 'text-gray-400 hover:text-white hover:bg-white/10'}"
		>
			All ({signalStore.signals.length})
		</button>

		{#each types as type}
			{@const count = signalStore.stats[type] || 0}
			<button
				onclick={() => signalStore.setFilter(type)}
				class="px-3 py-1 text-sm rounded-full transition-all {signalStore.filter === type
					? badgeClass[type]
					: 'text-gray-400 hover:text-white hover:bg-white/10'}"
			>
				{type} ({count})
			</button>
		{/each}

		<div class="flex-1"></div>

		<button
			onclick={() => signalStore.clear()}
			class="px-3 py-1 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
		>
			Clear
		</button>
	</div>
</div>
