<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import SignalStream from '$lib/components/signals/SignalStream.svelte';
	import SignalFilter from '$lib/components/signals/SignalFilter.svelte';
	import { signalStore } from '$lib/stores/signals.svelte';

	onMount(() => {
		// Ensure connected
		if (!signalStore.connected) {
			signalStore.connect();
		}
	});
</script>

<div class="flex flex-col h-full">
	<Header title="Signal Stream" />

	<div class="flex-1 p-6 flex flex-col gap-4 overflow-hidden">
		<SignalFilter />

		<div class="flex-1 overflow-auto custom-scrollbar">
			<SignalStream />
		</div>

		<!-- Connection status bar -->
		<div class="glass p-3 flex items-center justify-between">
			<div class="flex items-center gap-2">
				{#if signalStore.connected}
					<span class="status-dot status-healthy"></span>
					<span class="text-sm text-green-400">Connected to signal stream</span>
				{:else}
					<span class="status-dot status-error"></span>
					<span class="text-sm text-red-400">Disconnected</span>
				{/if}
			</div>
			<div class="flex items-center gap-4">
				<span class="text-sm text-gray-500">
					{signalStore.signals.length} signals in buffer
				</span>
				{#if !signalStore.connected}
					<button
						onclick={() => signalStore.connect()}
						class="px-3 py-1 text-sm bg-accent-blue/20 text-accent-blue rounded hover:bg-accent-blue/30"
					>
						Reconnect
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
