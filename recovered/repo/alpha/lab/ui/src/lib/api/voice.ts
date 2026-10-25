// Voice API - Profiles, samples, and TTS testing

import { get, post, del } from './client';

export interface VoiceStatus {
	ready: boolean;
	active_profile: string | null;
	model_loaded: boolean;
}

export interface VoiceProfile {
	id: string;
	name: string;
	gender: 'male' | 'female' | 'neutral';
	created_at: string;
	sample_count: number;
}

export interface VoiceSample {
	id: string;
	profile_id: string;
	filename: string;
	size_bytes: number;
	duration_ms?: number;
	mime_type: string;
	created_at: string;
}

export interface TestTtsRequest {
	text: string;
	profile_id?: string;
}

export interface TestTtsResponse {
	audio_url: string;
	duration_ms: number;
	latency_ms: number;
}

export async function getStatus(): Promise<VoiceStatus> {
	return get('/api/voice/status');
}

export async function listProfiles(): Promise<VoiceProfile[]> {
	return get('/api/voice/profiles');
}

export async function createProfile(
	name: string,
	gender: 'male' | 'female' | 'neutral'
): Promise<VoiceProfile> {
	return post('/api/voice/profiles', { name, gender });
}

export async function deleteProfile(profileId: string): Promise<void> {
	return del(`/api/voice/profiles/${profileId}`);
}

export async function listSamples(profileId?: string): Promise<VoiceSample[]> {
	const path = profileId ? `/api/voice/samples?profile_id=${profileId}` : '/api/voice/samples';
	return get(path);
}

export async function testTts(text: string, profileId?: string): Promise<TestTtsResponse> {
	return post('/api/voice/test', { text, profile_id: profileId });
}

export interface UploadSampleResponse {
	id: string;
	filename: string;
	size_bytes: number;
}

/**
 * Upload a voice sample (MP3, WAV, etc.) to a profile
 * Max size: 50MB
 */
export async function uploadSample(
	profileId: string,
	file: File,
	onProgress?: (percent: number) => void
): Promise<UploadSampleResponse> {
	const formData = new FormData();
	formData.append('profile_id', profileId);
	formData.append('file', file);

	// Use XMLHttpRequest for progress tracking
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();

		xhr.upload.addEventListener('progress', (e) => {
			if (e.lengthComputable && onProgress) {
				const percent = Math.round((e.loaded / e.total) * 100);
				onProgress(percent);
			}
		});

		xhr.addEventListener('load', () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve(JSON.parse(xhr.responseText));
			} else {
				reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
			}
		});

		xhr.addEventListener('error', () => {
			reject(new Error('Upload failed: network error'));
		});

		xhr.open('POST', 'http://localhost:3001/api/voice/samples/upload');
		xhr.send(formData);
	});
}

export async function deleteSample(sampleId: string): Promise<void> {
	return del(`/api/voice/samples/${sampleId}`);
}
