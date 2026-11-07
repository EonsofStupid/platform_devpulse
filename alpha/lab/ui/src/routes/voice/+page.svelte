<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import GenderSelector from '$lib/components/voice/GenderSelector.svelte';
	import ProfileList from '$lib/components/voice/ProfileList.svelte';
	import SampleList from '$lib/components/voice/SampleList.svelte';
	import SampleUpload from '$lib/components/voice/SampleUpload.svelte';
	import VoiceTester from '$lib/components/voice/VoiceTester.svelte';
	import { voiceStore } from '$lib/stores/voice.svelte';

	let profileName = $state('');

	onMount(() => {
		voiceStore.loadAll();
	});

	async function createProfile() {
		if (!profileName.trim()) return;
		await voiceStore.createProfile(profileName);
		profileName = '';
	}
</script>

<div class="flex flex-col h-full">
	<Header title="Voice Profiles" />

	<div class="flex-1 p-6 overflow-auto">
		<!-- Status bar -->
		<div class="glass p-4 mb-6 flex items-center justify-between">
			<div class="flex items-center gap-4">
				{#if voiceStore.isReady}
					<span class="status-dot status-healthy"></span>
					<span class="text-green-400">Voice system ready</span>
				{:else}
					<span class="status-dot status-degraded"></span>
					<span class="text-amber-400">Voice system initializing...</span>
				{/if}
			</div>
			{#if voiceStore.activeProfile}
				<div class="text-sm text-gray-400">
					Active: <span class="text-white">{voiceStore.activeProfile}</span>
				</div>
			{/if}
		</div>

		<div class="grid grid-cols-2 gap-6">
			<!-- Left column: Create profile + list -->
			<div class="space-y-4">
				<div class="glass p-4">
					<h3 class="text-sm font-medium text-gray-400 mb-3">Create Profile</h3>

					<div class="space-y-3">
						<input
							type="text"
							bind:value={profileName}
							placeholder="Profile name..."
							class="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-purple"
						/>

						<GenderSelector />

						<button
							onclick={createProfile}
							disabled={voiceStore.loading || !profileName.trim()}
							class="w-full px-4 py-2 bg-accent-purple/20 text-accent-purple border border-accent-purple rounded-lg hover:bg-accent-purple/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if voiceStore.loading}
								Creating...
							{:else}
								Create Profile
							{/if}
						</button>
					</div>
				</div>

				<div class="glass p-4">
					<h3 class="text-sm font-medium text-gray-400 mb-3">Profiles</h3>
					<ProfileList />
				</div>
			</div>

			<!-- Right column: Upload + Samples + Tester -->
			<div class="space-y-4">
				<SampleUpload />
				<SampleList />
				<VoiceTester />
			</div>
		</div>

		{#if voiceStore.error}
			<div class="mt-4 p-4 glass border-red-500/50 text-red-400">
				{voiceStore.error}
			</div>
		{/if}
	</div>
</div>
