<script lang="ts">
	import { voiceStore } from '$lib/stores/voice.svelte';

	function formatDuration(ms: number | undefined): string {
		if (!ms) return '--:--';
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${minutes}:${secs.toString().padStart(2, '0')}`;
	}

	async function handleDelete(e: Event, sampleId: string) {
		e.stopPropagation();
		if (confirm('Delete this voice sample?')) {
			await voiceStore.deleteSample(sampleId);
		}
	}
</script>

<div class="glass p-4">
	<h3 class="text-sm font-medium text-gray-400 mb-3">Voice Samples</h3>

	{#if voiceStore.samples.length === 0}
		<div class="text-center text-gray-500 py-4">
			<p>No samples uploaded</p>
		</div>
	{:else}
		<div class="space-y-2 max-h-64 overflow-auto custom-scrollbar">
			{#each voiceStore.samples as sample (sample.id)}
				<div
					class="flex items-center gap-3 p-2 rounded-lg transition-all {voiceStore.selectedSamples.includes(
						sample.id
					)
						? 'bg-accent-purple/20 border border-accent-purple'
						: 'bg-white/5 border border-transparent hover:bg-white/10'}"
				>
					<button
						type="button"
						class="flex-1 flex items-center gap-3 cursor-pointer text-left"
						onclick={() => voiceStore.toggleSample(sample.id)}
					>
						<div class="text-accent-purple">🎵</div>
						<div class="flex-1 min-w-0">
							<div class="text-sm text-white truncate">{sample.filename}</div>
							<div class="text-xs text-gray-500">{formatDuration(sample.duration_ms)}</div>
						</div>
						{#if voiceStore.selectedSamples.includes(sample.id)}
							<span class="text-accent-green">✓</span>
						{/if}
					</button>
					<button
						type="button"
						class="text-red-400/50 hover:text-red-400 p-1 transition-colors"
						onclick={(e) => handleDelete(e, sample.id)}
						title="Delete sample"
					>
						🗑️
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
