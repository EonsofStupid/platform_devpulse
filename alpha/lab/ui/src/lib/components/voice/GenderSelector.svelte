<script lang="ts">
	import { voiceStore } from '$lib/stores/voice.svelte';

	const options = [
		{ value: 'female' as const, label: 'Female', icon: '♀' },
		{ value: 'male' as const, label: 'Male', icon: '♂' },
		{ value: 'neutral' as const, label: 'Neutral', icon: '⚪' }
	];
</script>

<div class="flex gap-2">
	{#each options as option}
		<button
			onclick={() => (voiceStore.selectedGender = option.value)}
			class="flex-1 px-4 py-3 rounded-lg border transition-all {voiceStore.selectedGender ===
			option.value
				? 'bg-accent-purple/20 border-accent-purple text-white'
				: 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}"
		>
			<div class="text-xl mb-1">{option.icon}</div>
			<div class="text-sm">{option.label}</div>
		</button>
	{/each}
</div>
