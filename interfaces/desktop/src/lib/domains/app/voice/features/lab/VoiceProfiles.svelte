<!--
  @file Voice Profiles tab — save, activate, delete voice configs.
  @domain voice
-->
<script lang="ts">
import { Button } from "$lib/design/components/button/index.js";
import Card from "$lib/design/components/card/Card.svelte";
import Text from "$lib/design/components/text/Text.svelte";
import { FALLBACK_PROFILE } from "../../contracts/voice.contract.js";
import { activateProfile, deleteProfile } from "../../services/voice.svc.js";
import { voiceState } from "../../state/voice.state.svelte.js";

const profiles = $derived(
	voiceState.profiles.length > 0 ? voiceState.profiles : [FALLBACK_PROFILE],
);

async function handleActivate(profileId: string): Promise<void> {
	try {
		await activateProfile(profileId);
		voiceState.activeProfile = profiles.find((p) => p.id === profileId) ?? null;
	} catch (e) {
		voiceState.error = e instanceof Error ? e.message : String(e);
	}
}

async function handleDelete(profileId: string): Promise<void> {
	try {
		await deleteProfile(profileId);
		voiceState.profiles = voiceState.profiles.filter((p) => p.id !== profileId);
	} catch (e) {
		voiceState.error = e instanceof Error ? e.message : String(e);
	}
}
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between">
		<Text size="sm" weight="semibold" preset="default">Voice Profiles</Text>
		<Button preset="primary" size="sm">+ New Profile</Button>
	</div>

	<div class="grid grid-cols-1 gap-3">
		{#each profiles as profile}
			<Card preset={profile.active ? "neuro-elevated" : "neuro-minimal"}>
				<div class="p-4 flex items-center justify-between">
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2">
							{#if profile.active}
								<span class="text-[var(--accent-teal-main)]">★</span>
							{/if}
							<Text size="sm" weight="semibold" preset="default">{profile.name}</Text>
						</div>
						<Text size="xs" preset="default" class="text-[var(--text-muted)]">
							Voice: {profile.tts_voice_id} | STT quality: {profile.stt_quality}
						</Text>
					</div>
					<div class="flex items-center gap-2">
						{#if !profile.active}
							<Button preset="ghost" size="sm" onclick={() => handleActivate(profile.id)}>
								Activate
							</Button>
						{/if}
						<Button preset="ghost" size="sm">Edit</Button>
						{#if profile.id !== "default"}
							<Button preset="ghost" size="sm" onclick={() => handleDelete(profile.id)}>
								Delete
							</Button>
						{/if}
					</div>
				</div>
			</Card>
		{/each}
	</div>
</div>
