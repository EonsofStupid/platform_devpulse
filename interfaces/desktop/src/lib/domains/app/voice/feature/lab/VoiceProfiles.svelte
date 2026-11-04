<!--
  @file Voice Profiles tab — save, activate, delete voice configs.
  @domain voice
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@devpulse/coldlight/components/select";
import { Text } from "@devpulse/coldlight/components/text";
import { TextField } from "@devpulse/coldlight/components/text-field";
import { onMount } from "svelte";
import { fill } from "#lib/sys/copy/index.js";
import {
	activateProfile,
	deleteProfile,
	listProfiles,
	listVoices,
	saveProfile,
} from "../../data-access/voice.service.js";
import { voiceState } from "../../data-access/voice.state.svelte.js";
import {
	DEFAULT_PROFILE_ID,
	type VoiceLabCopy,
	type VoiceProfile,
} from "../../util/voice.contract.js";

let { copy }: { copy: VoiceLabCopy } = $props();

/** The profile being created or edited; null while just viewing. */
let draft = $state<VoiceProfile | null>(null);
let saving = $state(false);

const profiles = $derived(voiceState.profiles);
const draftVoiceLabel = $derived(
	voiceState.ttsVoices.find((voice) => voice.id === draft?.tts_voice_id)?.label ??
		draft?.tts_voice_id ??
		"",
);
const draftQualityLabel = $derived(
	copy.profiles.qualities.find((quality: { value: string }) => quality.value === draft?.stt_quality)
		?.label ??
		draft?.stt_quality ??
		"",
);

function report(e: unknown): void {
	voiceState.error = e instanceof Error ? e.message : String(e);
}

async function refreshProfiles(): Promise<void> {
	try {
		voiceState.profiles = await listProfiles();
		voiceState.activeProfile = voiceState.profiles.find((p) => p.active) ?? null;
	} catch (e) {
		report(e);
	}
}

onMount(() => {
	void refreshProfiles();
	if (voiceState.ttsVoices.length === 0) {
		listVoices(voiceState.selectedTtsSlot)
			.then((voices) => {
				voiceState.ttsVoices = voices;
			})
			.catch(report);
	}
});

function startNew(): void {
	draft = {
		id: crypto.randomUUID(),
		name: "",
		tts_voice_id: voiceState.selectedVoice,
		stt_quality: copy.profiles.qualities[0]?.value ?? "",
		active: false,
	};
}

async function handleSave(): Promise<void> {
	if (!draft) return;
	saving = true;
	try {
		await saveProfile({ ...draft });
		draft = null;
		await refreshProfiles();
	} catch (e) {
		report(e);
	} finally {
		saving = false;
	}
}

async function handleActivate(profile: VoiceProfile): Promise<void> {
	try {
		await activateProfile(profile.id);
		voiceState.selectedVoice = profile.tts_voice_id;
		await refreshProfiles();
	} catch (e) {
		report(e);
	}
}

async function handleDelete(profileId: string): Promise<void> {
	try {
		await deleteProfile(profileId);
		await refreshProfiles();
	} catch (e) {
		report(e);
	}
}
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between">
		<Text size="sm" weight="semibold">{copy.profiles.title}</Text>
		<Button variant="primary" size="sm" onclick={startNew} disabled={draft !== null}>
			{copy.profiles.new}
		</Button>
	</div>

	<Text size="sm" color="muted">{copy.profiles.settings_note}</Text>

	{#if draft}
		<Card variant="minimal">
			<div class="p-4 flex flex-col gap-3">
				<TextField label={copy.profiles.name} bind:value={draft.name} required disabled={saving} />
				<div class="flex flex-col gap-1">
					<Text size="sm">{copy.profiles.voice}</Text>
					<Select
						value={draft.tts_voice_id}
						onValueChange={(id: string) => {
							if (draft) draft.tts_voice_id = id;
						}}
						disabled={saving}
					>
						<SelectTrigger aria-label={copy.profiles.voice}>{draftVoiceLabel}</SelectTrigger>
						<SelectContent>
							{#each voiceState.ttsVoices as voice (voice.id)}
								<SelectItem value={voice.id}>{voice.label}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>
				<div class="flex flex-col gap-1">
					<Text size="sm">{copy.profiles.quality}</Text>
					<Select
						value={draft.stt_quality}
						onValueChange={(quality: string) => {
							if (draft) draft.stt_quality = quality;
						}}
						disabled={saving}
					>
						<SelectTrigger aria-label={copy.profiles.quality}>{draftQualityLabel}</SelectTrigger>
						<SelectContent>
							{#each copy.profiles.qualities as quality (quality.value)}
								<SelectItem value={quality.value}>{quality.label}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>
				<div class="flex items-center gap-2">
					<Button
						variant="primary"
						size="sm"
						onclick={handleSave}
						disabled={saving || !draft.name.trim()}
					>
						{copy.profiles.save}
					</Button>
					<Button variant="ghost" size="sm" onclick={() => (draft = null)} disabled={saving}>
						{copy.profiles.cancel}
					</Button>
				</div>
			</div>
		</Card>
	{/if}

	<div class="grid grid-cols-1 gap-3">
		{#each profiles as profile (profile.id)}
			<Card variant={profile.active ? "elevated" : "minimal"}>
				<div class="p-4 flex items-center justify-between">
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2">
							{#if profile.active}
								<Badge variant="positive" size="sm">{copy.profiles.active}</Badge>
							{/if}
							<Text size="sm" weight="semibold">{profile.name}</Text>
						</div>
						<Text size="sm" color="muted">
							{fill(copy.profiles.summary, {
								voice: profile.tts_voice_id,
								quality: profile.stt_quality,
							})}
						</Text>
					</div>
					<div class="flex items-center gap-2">
						{#if !profile.active}
							<Button variant="ghost" size="sm" onclick={() => handleActivate(profile)}>
								{copy.profiles.activate}
							</Button>
						{/if}
						<Button
							variant="ghost"
							size="sm"
							onclick={() => (draft = { ...profile })}
							disabled={draft !== null}
						>
							{copy.profiles.edit}
						</Button>
						{#if profile.id !== DEFAULT_PROFILE_ID}
							<Button variant="ghost" size="sm" onclick={() => handleDelete(profile.id)}>
								{copy.profiles.delete}
							</Button>
						{/if}
					</div>
				</div>
			</Card>
		{/each}
	</div>
</div>
