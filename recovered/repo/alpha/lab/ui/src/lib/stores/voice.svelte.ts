// Voice Store - Svelte 5 runes for voice profiles and TTS

import * as api from '$lib/api/voice';

class VoiceStore {
	status = $state<api.VoiceStatus | null>(null);
	profiles = $state<api.VoiceProfile[]>([]);
	samples = $state<api.VoiceSample[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);

	// Selected gender for new profile
	selectedGender = $state<'male' | 'female' | 'neutral'>('female');

	// Selected samples for profile generation
	selectedSamples = $state<string[]>([]);

	// Test TTS state
	testText = $state('');
	testResult = $state<api.TestTtsResponse | null>(null);
	testing = $state(false);

	// Upload state
	uploading = $state(false);
	uploadProgress = $state(0);

	get isReady() {
		return this.status?.ready ?? false;
	}

	get activeProfile() {
		return this.status?.active_profile ?? null;
	}

	async loadAll() {
		this.loading = true;
		this.error = null;
		try {
			const [status, profiles, samples] = await Promise.all([
				api.getStatus(),
				api.listProfiles(),
				api.listSamples()
			]);
			this.status = status;
			this.profiles = profiles;
			this.samples = samples;
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to load voice data';
		} finally {
			this.loading = false;
		}
	}

	async createProfile(name: string) {
		this.loading = true;
		this.error = null;
		try {
			const profile = await api.createProfile(name, this.selectedGender);
			this.profiles = [...this.profiles, profile];
			return profile;
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to create profile';
			throw e;
		} finally {
			this.loading = false;
		}
	}

	async deleteProfile(profileId: string) {
		try {
			await api.deleteProfile(profileId);
			this.profiles = this.profiles.filter((p) => p.id !== profileId);
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to delete profile';
			throw e;
		}
	}

	async testTts(text: string, profileId?: string) {
		this.testing = true;
		this.testResult = null;
		try {
			this.testResult = await api.testTts(text, profileId);
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'TTS test failed';
		} finally {
			this.testing = false;
		}
	}

	toggleSample(sampleId: string) {
		if (this.selectedSamples.includes(sampleId)) {
			this.selectedSamples = this.selectedSamples.filter((id) => id !== sampleId);
		} else {
			this.selectedSamples = [...this.selectedSamples, sampleId];
		}
	}

	async uploadSample(profileId: string, file: File) {
		this.uploading = true;
		this.uploadProgress = 0;
		this.error = null;
		try {
			const result = await api.uploadSample(profileId, file, (percent) => {
				this.uploadProgress = percent;
			});
			// Refresh samples list
			this.samples = await api.listSamples();
			// Update profile sample count
			const profile = this.profiles.find((p) => p.id === profileId);
			if (profile) {
				profile.sample_count++;
				this.profiles = [...this.profiles];
			}
			return result;
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Upload failed';
			throw e;
		} finally {
			this.uploading = false;
			this.uploadProgress = 0;
		}
	}

	async deleteSample(sampleId: string) {
		try {
			const sample = this.samples.find((s) => s.id === sampleId);
			await api.deleteSample(sampleId);
			this.samples = this.samples.filter((s) => s.id !== sampleId);
			this.selectedSamples = this.selectedSamples.filter((id) => id !== sampleId);
			// Update profile sample count
			if (sample) {
				const profile = this.profiles.find((p) => p.id === sample.profile_id);
				if (profile && profile.sample_count > 0) {
					profile.sample_count--;
					this.profiles = [...this.profiles];
				}
			}
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Delete failed';
			throw e;
		}
	}
}

export const voiceStore = new VoiceStore();
