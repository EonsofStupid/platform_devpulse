<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import { modelsStore } from '$lib/stores/models.svelte';

	onMount(() => {
		modelsStore.loadAll();
	});

	function formatVram(gb: number): string {
		return `${gb.toFixed(1)} GB`;
	}

	function formatFamily(family: string): string {
		const names: Record<string, string> = {
			qwen3_vl: 'VL (Vision-Language)',
			qwen3_embed: 'Embedder',
			qwen3_rerank: 'Reranker',
			whisper: 'Whisper STT',
			kokoro: 'Kokoro TTS'
		};
		return names[family] || family;
	}
</script>

<div class="flex flex-col h-full">
	<Header title="Model Management" />

	<div class="flex-1 p-6 overflow-auto">
		<!-- Summary bar -->
		<div class="glass p-4 mb-6">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-6">
					<div>
						<span class="text-gray-400 text-sm">Total Models</span>
						<div class="text-xl font-semibold">{modelsStore.summary?.total_models ?? 0}</div>
					</div>
					<div>
						<span class="text-gray-400 text-sm">Available</span>
						<div class="text-xl font-semibold text-green-400">{modelsStore.availableCount}</div>
					</div>
					<div>
						<span class="text-gray-400 text-sm">Missing</span>
						<div class="text-xl font-semibold text-amber-400">
							{modelsStore.summary?.missing_count ?? 0}
						</div>
					</div>
				</div>
				<button
					onclick={() => modelsStore.loadAll()}
					disabled={modelsStore.loading}
					class="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
				>
					{#if modelsStore.loading}
						Refreshing...
					{:else}
						Refresh
					{/if}
				</button>
			</div>
		</div>

		<!-- Active models summary -->
		<div class="glass p-4 mb-6">
			<h3 class="text-sm font-medium text-gray-400 mb-3">Active Models</h3>
			<div class="grid grid-cols-3 gap-4">
				<div class="p-3 bg-white/5 rounded-lg">
					<div class="text-xs text-gray-500 mb-1">Chat (VL)</div>
					<div class="text-sm font-medium">
						{modelsStore.summary?.active_vl ?? 'Not set'}
					</div>
				</div>
				<div class="p-3 bg-white/5 rounded-lg">
					<div class="text-xs text-gray-500 mb-1">Embedder</div>
					<div class="text-sm font-medium">
						{modelsStore.summary?.active_embed ?? 'Not set'}
					</div>
				</div>
				<div class="p-3 bg-white/5 rounded-lg">
					<div class="text-xs text-gray-500 mb-1">Reranker</div>
					<div class="text-sm font-medium">
						{modelsStore.summary?.active_rerank ?? 'Not set'}
					</div>
				</div>
			</div>
		</div>

		<!-- VL Models (Chat) -->
		<div class="glass p-4 mb-4">
			<h3 class="text-sm font-medium text-gray-400 mb-3">Vision-Language Models (Chat)</h3>
			<div class="space-y-2">
				{#each modelsStore.vlModels as model}
					<div
						class="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
					>
						<div class="flex items-center gap-3">
							<div
								class="w-2 h-2 rounded-full {model.available
									? 'bg-green-400'
									: 'bg-red-400'}"
							></div>
							<div>
								<div class="font-medium">{model.name}</div>
								<div class="text-xs text-gray-500">
									{model.params_b}B params | {model.quantization ?? 'F16'} |
									{formatVram(model.vram_gb)} VRAM
								</div>
							</div>
						</div>
						<div class="flex items-center gap-2">
							{#if model.is_active}
								<span class="px-2 py-1 text-xs bg-accent-purple/20 text-accent-purple rounded"
									>Active</span
								>
							{:else if model.available}
								<button
									onclick={() => modelsStore.setActive(model.id)}
									disabled={modelsStore.loading}
									class="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-all"
								>
									Set Active
								</button>
							{:else}
								<span class="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">Missing</span>
							{/if}
						</div>
					</div>
				{/each}
				{#if modelsStore.vlModels.length === 0}
					<div class="text-gray-500 text-sm">No VL models registered</div>
				{/if}
			</div>
		</div>

		<!-- Embedder Models -->
		<div class="glass p-4 mb-4">
			<h3 class="text-sm font-medium text-gray-400 mb-3">Embedding Models</h3>
			<div class="space-y-2">
				{#each modelsStore.embedModels as model}
					<div
						class="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
					>
						<div class="flex items-center gap-3">
							<div
								class="w-2 h-2 rounded-full {model.available
									? 'bg-green-400'
									: 'bg-red-400'}"
							></div>
							<div>
								<div class="font-medium">{model.name}</div>
								<div class="text-xs text-gray-500">
									{model.params_b}B params | {formatVram(model.vram_gb)} VRAM
								</div>
							</div>
						</div>
						<div class="flex items-center gap-2">
							{#if model.is_active}
								<span class="px-2 py-1 text-xs bg-accent-purple/20 text-accent-purple rounded"
									>Active</span
								>
							{:else if model.available}
								<button
									onclick={() => modelsStore.setActive(model.id)}
									disabled={modelsStore.loading}
									class="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-all"
								>
									Set Active
								</button>
							{:else}
								<span class="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">Missing</span>
							{/if}
						</div>
					</div>
				{/each}
				{#if modelsStore.embedModels.length === 0}
					<div class="text-gray-500 text-sm">No embedding models registered</div>
				{/if}
			</div>
		</div>

		<!-- Reranker Models -->
		<div class="glass p-4 mb-4">
			<h3 class="text-sm font-medium text-gray-400 mb-3">Reranker Models</h3>
			<div class="space-y-2">
				{#each modelsStore.rerankModels as model}
					<div
						class="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
					>
						<div class="flex items-center gap-3">
							<div
								class="w-2 h-2 rounded-full {model.available
									? 'bg-green-400'
									: 'bg-red-400'}"
							></div>
							<div>
								<div class="font-medium">{model.name}</div>
								<div class="text-xs text-gray-500">
									{model.params_b}B params | {model.quantization ?? 'F16'} |
									{formatVram(model.vram_gb)} VRAM
								</div>
							</div>
						</div>
						<div class="flex items-center gap-2">
							{#if model.is_active}
								<span class="px-2 py-1 text-xs bg-accent-purple/20 text-accent-purple rounded"
									>Active</span
								>
							{:else if model.available}
								<button
									onclick={() => modelsStore.setActive(model.id)}
									disabled={modelsStore.loading}
									class="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-all"
								>
									Set Active
								</button>
							{:else}
								<span class="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">Missing</span>
							{/if}
						</div>
					</div>
				{/each}
				{#if modelsStore.rerankModels.length === 0}
					<div class="text-gray-500 text-sm">No reranker models registered</div>
				{/if}
			</div>
		</div>

		{#if modelsStore.error}
			<div class="mt-4 p-4 glass border-red-500/50 text-red-400">
				{modelsStore.error}
			</div>
		{/if}
	</div>
</div>
