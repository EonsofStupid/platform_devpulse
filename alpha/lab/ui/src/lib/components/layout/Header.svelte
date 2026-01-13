<script lang="ts">
	import { signalStore } from '$lib/stores/signals.svelte';
	import { backgroundStore } from '$lib/stores/background.svelte';

	interface Props {
		title: string;
	}

	let { title }: Props = $props();
</script>

<header class="h-16 glass flex items-center justify-between px-6 border-b border-white/10">
	<h2 class="text-lg font-semibold text-white">{title}</h2>

	<div class="flex items-center gap-6 text-sm">
		<!-- Signal count -->
		<div class="flex items-center gap-2 text-gray-400">
			<span>Signals:</span>
			<span class="mono text-accent-blue">{signalStore.signals.length}</span>
		</div>

		<!-- Memory usage -->
		{#if backgroundStore.totalMemoryMb > 0}
			<div class="flex items-center gap-2 text-gray-400">
				<span>VRAM:</span>
				<span class="mono text-accent-purple">{(backgroundStore.totalMemoryMb / 1024).toFixed(1)} GB</span>
			</div>
		{/if}

		<!-- Health indicator -->
		<div class="flex items-center gap-2">
			{#if backgroundStore.health === 'healthy'}
				<span class="status-dot status-healthy"></span>
				<span class="text-green-400">Healthy</span>
			{:else if backgroundStore.health === 'degraded'}
				<span class="status-dot status-degraded"></span>
				<span class="text-amber-400">Degraded</span>
			{:else}
				<span class="status-dot status-error"></span>
				<span class="text-red-400">Error</span>
			{/if}
		</div>
	</div>
</header>
