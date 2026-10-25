/**
 * Voice Store - TTS/STT state management
 *
 * Recording flow:
 * 1. startRecording() - capture mic via MediaRecorder
 * 2. stopRecording() - stop capture, convert to WAV, return transcription
 * 3. speakText() - TTS playback
 */
import {
	getVoiceStatus,
	checkVoiceStatus,
	getVoiceDownloadInstructions,
	speak,
	transcribe,
	type VoiceStatus
} from '$lib/api/voice';

class VoiceStore {
	status = $state<VoiceStatus | null>(null);
	isRecording = $state(false);
	isSpeaking = $state(false);
	isRefreshing = $state(false);
	error = $state<string | null>(null);
	lastTranscription = $state<string | null>(null);
	downloadInstructions = $state<string | null>(null);

	// Audio context for playback
	private audioContext: AudioContext | null = null;
	// MediaRecorder for mic capture
	private mediaRecorder: MediaRecorder | null = null;
	private audioChunks: Blob[] = [];
	// Callback for when transcription completes
	private onTranscriptionComplete: ((text: string) => void) | null = null;

	async init() {
		try {
			this.status = await getVoiceStatus();
		} catch (e) {
			this.error = String(e);
		}
	}

	async speakText(text: string) {
		if (!this.status?.tts_ready) {
			this.error = 'TTS not available';
			return;
		}

		this.isSpeaking = true;
		try {
			const wavBytes = await speak(text);
			await this.playAudio(wavBytes);
		} catch (e) {
			this.error = String(e);
		} finally {
			this.isSpeaking = false;
		}
	}

	async transcribeAudio(audioBytes: Uint8Array): Promise<string | null> {
		if (!this.status?.stt_ready) {
			this.error = 'STT not available';
			return null;
		}

		try {
			return await transcribe(audioBytes);
		} catch (e) {
			this.error = String(e);
			return null;
		}
	}

	private async playAudio(wavBytes: Uint8Array) {
		if (!this.audioContext) {
			this.audioContext = new AudioContext();
		}
		const arrayBuffer = wavBytes.buffer.slice(wavBytes.byteOffset, wavBytes.byteOffset + wavBytes.byteLength) as ArrayBuffer;
		const buffer = await this.audioContext.decodeAudioData(arrayBuffer);
		const source = this.audioContext.createBufferSource();
		source.buffer = buffer;
		source.connect(this.audioContext.destination);
		source.start();
	}

	/**
	 * Start recording from microphone
	 * @param onComplete - Called with transcribed text when recording stops
	 */
	async startRecording(onComplete?: (text: string) => void): Promise<void> {
		if (!this.status?.stt_ready) {
			this.error = 'STT not available';
			return;
		}

		if (this.isRecording) {
			return;
		}

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			this.audioChunks = [];
			this.onTranscriptionComplete = onComplete || null;

			// Use webm/opus for browser compatibility, will convert to WAV
			this.mediaRecorder = new MediaRecorder(stream, {
				mimeType: 'audio/webm;codecs=opus'
			});

			this.mediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) {
					this.audioChunks.push(e.data);
				}
			};

			this.mediaRecorder.onstop = async () => {
				// Stop all tracks to release mic
				stream.getTracks().forEach((track) => track.stop());

				if (this.audioChunks.length === 0) {
					this.isRecording = false;
					return;
				}

				// Convert webm to WAV for backend
				const webmBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
				const wavBytes = await this.convertToWav(webmBlob);

				if (wavBytes) {
					const text = await this.transcribeAudio(wavBytes);
					if (text) {
						this.lastTranscription = text;
						this.onTranscriptionComplete?.(text);
					}
				}
				this.isRecording = false;
			};

			this.mediaRecorder.start(100); // Collect data every 100ms
			this.isRecording = true;
		} catch (e) {
			this.error = `Microphone access failed: ${e}`;
			this.isRecording = false;
		}
	}

	/**
	 * Stop recording and transcribe
	 */
	stopRecording(): void {
		if (!this.isRecording || !this.mediaRecorder) {
			return;
		}
		this.mediaRecorder.stop();
	}

	/**
	 * Toggle recording on/off
	 * @param onComplete - Called with transcribed text when recording stops
	 */
	toggleRecording(onComplete?: (text: string) => void): void {
		if (this.isRecording) {
			this.stopRecording();
		} else {
			this.startRecording(onComplete);
		}
	}

	/**
	 * Convert webm/opus blob to WAV bytes for backend STT
	 * Uses AudioContext to decode and re-encode
	 */
	private async convertToWav(webmBlob: Blob): Promise<Uint8Array | null> {
		try {
			if (!this.audioContext) {
				this.audioContext = new AudioContext();
			}

			const arrayBuffer = await webmBlob.arrayBuffer();
			const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

			// Convert to 16kHz mono WAV (Whisper expects this)
			const wavBuffer = this.audioBufferToWav(audioBuffer);
			return new Uint8Array(wavBuffer);
		} catch (e) {
			this.error = `Audio conversion failed: ${e}`;
			return null;
		}
	}

	/**
	 * Convert AudioBuffer to WAV format (16kHz mono, 16-bit PCM)
	 */
	private audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
		const targetSampleRate = 16000;
		const numChannels = 1; // Mono

		// Resample to 16kHz mono
		const samples = this.resampleAudio(buffer, targetSampleRate);

		// Create WAV file
		const wavHeader = 44;
		const wavBuffer = new ArrayBuffer(wavHeader + samples.length * 2);
		const view = new DataView(wavBuffer);

		// RIFF header
		this.writeString(view, 0, 'RIFF');
		view.setUint32(4, wavBuffer.byteLength - 8, true);
		this.writeString(view, 8, 'WAVE');

		// fmt chunk
		this.writeString(view, 12, 'fmt ');
		view.setUint32(16, 16, true); // Chunk size
		view.setUint16(20, 1, true); // Audio format (PCM)
		view.setUint16(22, numChannels, true);
		view.setUint32(24, targetSampleRate, true);
		view.setUint32(28, targetSampleRate * numChannels * 2, true); // Byte rate
		view.setUint16(32, numChannels * 2, true); // Block align
		view.setUint16(34, 16, true); // Bits per sample

		// data chunk
		this.writeString(view, 36, 'data');
		view.setUint32(40, samples.length * 2, true);

		// Write samples as 16-bit PCM
		let offset = 44;
		for (let i = 0; i < samples.length; i++) {
			const s = Math.max(-1, Math.min(1, samples[i]));
			view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
			offset += 2;
		}

		return wavBuffer;
	}

	/**
	 * Resample audio to target rate and mix to mono
	 */
	private resampleAudio(buffer: AudioBuffer, targetRate: number): Float32Array {
		const ratio = buffer.sampleRate / targetRate;
		const newLength = Math.floor(buffer.length / ratio);
		const result = new Float32Array(newLength);

		// Mix channels to mono
		const channels: Float32Array[] = [];
		for (let c = 0; c < buffer.numberOfChannels; c++) {
			channels.push(buffer.getChannelData(c));
		}

		for (let i = 0; i < newLength; i++) {
			const srcIndex = Math.floor(i * ratio);
			let sum = 0;
			for (const channel of channels) {
				sum += channel[srcIndex] || 0;
			}
			result[i] = sum / channels.length;
		}

		return result;
	}

	private writeString(view: DataView, offset: number, str: string) {
		for (let i = 0; i < str.length; i++) {
			view.setUint8(offset + i, str.charCodeAt(i));
		}
	}

	clearError() {
		this.error = null;
	}

	/**
	 * Refresh voice model status (check for newly downloaded models)
	 */
	async refresh(): Promise<void> {
		this.isRefreshing = true;
		this.error = null;

		try {
			this.status = await checkVoiceStatus();
		} catch (e) {
			this.error = String(e);
		} finally {
			this.isRefreshing = false;
		}
	}

	/**
	 * Fetch download instructions for missing models
	 */
	async fetchDownloadInstructions(): Promise<void> {
		try {
			this.downloadInstructions = await getVoiceDownloadInstructions();
		} catch (e) {
			this.error = String(e);
		}
	}

	/**
	 * Check if voice is fully ready (both STT and TTS)
	 */
	get isFullyReady(): boolean {
		return this.status?.stt_ready && this.status?.tts_ready || false;
	}

	/**
	 * Check if voice is partially ready (at least one service)
	 */
	get isPartiallyReady(): boolean {
		return this.status?.stt_ready || this.status?.tts_ready || false;
	}
}

export const voiceStore = new VoiceStore();
