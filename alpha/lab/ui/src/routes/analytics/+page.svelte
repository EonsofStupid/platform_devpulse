<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import { analyticsStore } from '$lib/stores';

	onMount(() => {
		analyticsStore.refresh();
		// Auto-refresh every 30 seconds
		const interval = setInterval(() => analyticsStore.refresh(), 30000);
		return () => clearInterval(interval);
	});

	function formatNumber(n: number): string {
		if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
		if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
		return n.toString();
	}
</script>

<div class="flex flex-col h-full">
	<Header title="Analytics" />

	<div class="flex-1 p-6 overflow-auto">
		{#if analyticsStore.loading && !analyticsStore.data}
			<div class="flex items-center justify-center h-32">
				<div class="text-gray-400">Loading analytics...</div>
			</div>
		{:else if analyticsStore.error}
			<div class="p-4 glass border-red-500/50 text-red-400">
				{analyticsStore.error}
			</div>
		{:else if analyticsStore.data}
			<!-- Summary Stats -->
			<div class="grid grid-cols-4 gap-4 mb-6">
				<div class="glass p-4">
					<div class="text-sm text-gray-400">Total Events</div>
					<div class="text-2xl font-bold text-white mono">
						{formatNumber(analyticsStore.eventCount)}
					</div>
				</div>
				<div class="glass p-4">
					<div class="text-sm text-gray-400">Total Inferences</div>
					<div class="text-2xl font-bold text-accent-blue">
						{formatNumber(analyticsStore.inference?.total_inferences ?? 0)}
					</div>
				</div>
				<div class="glass p-4">
					<div class="text-sm text-gray-400">Avg Latency</div>
					<div class="text-2xl font-bold text-accent-green">
						{(analyticsStore.inference?.avg_latency_ms ?? 0).toFixed(0)} ms
					</div>
				</div>
				<div class="glass p-4">
					<div class="text-sm text-gray-400">P99 Latency</div>
					<div class="text-2xl font-bold text-accent-purple">
						{(analyticsStore.inference?.p99_latency_ms ?? 0).toFixed(0)} ms
					</div>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-6">
				<!-- Inference Details -->
				<div class="glass p-4">
					<h3 class="text-lg font-semibold text-white mb-4">Inference Stats</h3>
					<div class="space-y-3">
						<div class="flex justify-between">
							<span class="text-gray-400">Total Inferences</span>
							<span class="mono text-white">{formatNumber(analyticsStore.inference?.total_inferences ?? 0)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-400">Tokens In</span>
							<span class="mono text-accent-blue">{formatNumber(analyticsStore.inference?.total_tokens_in ?? 0)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-400">Tokens Out</span>
							<span class="mono text-accent-green">{formatNumber(analyticsStore.inference?.total_tokens_out ?? 0)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-400">Avg Latency</span>
							<span class="mono text-white">{(analyticsStore.inference?.avg_latency_ms ?? 0).toFixed(1)} ms</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-400">P99 Latency</span>
							<span class="mono text-accent-purple">{(analyticsStore.inference?.p99_latency_ms ?? 0).toFixed(1)} ms</span>
						</div>
					</div>
				</div>

				<!-- Hop Stats -->
				<div class="glass p-4">
					<h3 class="text-lg font-semibold text-white mb-4">Hop Stats</h3>
					<div class="space-y-3">
						<div class="flex justify-between">
							<span class="text-gray-400">Total Hops</span>
							<span class="mono text-white">{formatNumber(analyticsStore.hops?.total_hops ?? 0)}</span>
						</div>
						{#if analyticsStore.hops?.by_type}
							{#each Object.entries(analyticsStore.hops.by_type) as [hopType, count]}
								<div class="flex justify-between">
									<span class="text-gray-400 capitalize">{hopType}</span>
									<span class="mono text-accent-blue">{formatNumber(count)}</span>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>

			<!-- Last Updated -->
			{#if analyticsStore.lastUpdated}
				<div class="mt-6 text-center text-sm text-gray-500">
					Last updated: {new Date(analyticsStore.lastUpdated).toLocaleTimeString()}
					<button
						class="ml-2 text-accent-blue hover:underline"
						onclick={() => analyticsStore.refresh()}
						disabled={analyticsStore.loading}
					>
						{analyticsStore.loading ? 'Refreshing...' : 'Refresh'}
					</button>
				</div>
			{/if}
		{:else}
			<div class="text-center text-gray-400">
				No analytics data available
			</div>
		{/if}
	</div>
</div>
