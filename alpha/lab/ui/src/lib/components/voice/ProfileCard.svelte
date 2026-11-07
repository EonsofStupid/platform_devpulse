<script lang="ts">
	import type { VoiceProfile } from '$lib/api/voice';
	import { voiceStore } from '$lib/stores/voice.svelte';

	interface Props {
		profile: VoiceProfile;
	}

	let { profile }: Props = $props();

	const genderIcons: Record<string, string> = {
		female: '♀',
		male: '♂',
		neutral: '⚪'
	};

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString();
	}
</script>

<div class="glass p-4 glass-hover">
	<div class="flex items-start justify-between">
		<div class="flex items-center gap-3">
			<div
				class="w-10 h-10 rounded-full bg-accent-purple/20 flex items-center justify-center text-lg"
			>
				{genderIcons[profile.gender] || '🎤'}
			</div>
			<div>
				<div class="font-medium text-white">{profile.name}</div>
				<div class="text-xs text-gray-500">
					{profile.sample_count} samples • {formatDate(profile.created_at)}
				</div>
			</div>
		</div>

		<button
			onclick={() => voiceStore.deleteProfile(profile.id)}
			class="text-gray-500 hover:text-red-400 transition-colors"
		>
			✕
		</button>
	</div>
</div>
