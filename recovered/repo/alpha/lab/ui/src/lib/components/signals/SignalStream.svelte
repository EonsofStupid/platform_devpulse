<script lang="ts">
	import { signalStore } from '$lib/stores/signals.svelte';
	import SignalCard from './SignalCard.svelte';
</script>

<div class="space-y-2">
	{#if signalStore.filtered.length === 0}
		<div class="glass p-8 text-center text-gray-500">
			{#if signalStore.connected}
				<p>Waiting for signals...</p>
			{:else}
				<p>Not connected to signal stream</p>
				<button
					onclick={() => signalStore.connect()}
					class="mt-4 px-4 py-2 glass glass-hover text-sm"
				>
					Connect
				</button>
			{/if}
		</div>
	{:else}
		{#each signalStore.filtered as signal (signal.id)}
			<SignalCard {signal} />
		{/each}
	{/if}
</div>
