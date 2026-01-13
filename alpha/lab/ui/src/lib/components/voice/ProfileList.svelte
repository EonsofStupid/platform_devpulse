<script lang="ts">
	import { voiceStore } from '$lib/stores/voice.svelte';
	import ProfileCard from './ProfileCard.svelte';
</script>

<div class="space-y-2">
	{#if voiceStore.profiles.length === 0}
		<div class="glass p-8 text-center text-gray-500">
			<p>No voice profiles yet</p>
			<p class="text-xs mt-2">Create a profile to get started</p>
		</div>
	{:else}
		{#each voiceStore.profiles as profile (profile.id)}
			<ProfileCard {profile} />
		{/each}
	{/if}
</div>
