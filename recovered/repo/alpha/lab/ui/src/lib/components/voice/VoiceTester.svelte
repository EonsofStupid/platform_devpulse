<script lang="ts">
	import { voiceStore } from '$lib/stores/voice.svelte';

	let testText = $state('Hello, this is a test of the DevPulse voice synthesis system.');

	async function runTest() {
		if (!testText.trim()) return;
		await voiceStore.testTts(testText);
	}
</script>

<div class="glass p-4">
	<h3 class="text-sm font-medium text-gray-400 mb-3">TTS Tester</h3>

	<div class="space-y-3">
		<textarea
			bind:value={testText}
			placeholder="Enter text to synthesize..."
			rows="3"
			class="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-purple resize-none"
		></textarea>

		<div class="flex items-center justify-between">
			<button
				onclick={runTest}
				disabled={voiceStore.testing || !testText.trim()}
				class="px-4 py-2 bg-accent-purple/20 text-accent-purple border border-accent-purple rounded-lg hover:bg-accent-purple/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if voiceStore.testing}
					Synthesizing...
				{:else}
					Test TTS
				{/if}
			</button>

			{#if voiceStore.testResult}
				<div class="text-sm text-gray-400">
					<span class="text-accent-green">{voiceStore.testResult.duration_ms}ms</span> audio,
					<span class="text-accent-blue">{voiceStore.testResult.latency_ms}ms</span> latency
				</div>
			{/if}
		</div>

		{#if voiceStore.testResult?.audio_url}
			<audio controls src={voiceStore.testResult.audio_url} class="w-full mt-2">
				<track kind="captions" />
			</audio>
		{/if}
	</div>
</div>
