/**
 * @file Voice state rune — reactive state for Voice Lab.
 * @domain voice
 */

import type {
	MicTestResult,
	VoiceInfo,
	VoiceLabTab,
	VoiceProfile,
} from "../contracts/voice.contract.js";

class VoiceState {
	/** Active tab in Voice Lab. */
	activeTab = $state<VoiceLabTab>("tts");

	/** Currently active voice profile. */
	activeProfile = $state<VoiceProfile | null>(null);

	/** All saved voice profiles. */
	profiles = $state<VoiceProfile[]>([]);

	/** Available TTS voices for the current slot. */
	ttsVoices = $state<VoiceInfo[]>([]);

	/** Whether Clyffy is currently speaking. */
	isSpeaking = $state(false);

	/** Whether microphone is actively capturing. */
	isListening = $state(false);

	/** Last STT transcription result. */
	lastTranscription = $state("");

	/** Last transcript produced by an upload or STS run (distinct from mic). */
	lastTranscript = $state("");

	/** Last reply text produced by the STS pipeline. */
	lastReply = $state("");

	/** Last microphone test result. */
	micTest = $state<MicTestResult | null>(null);

	/** Loading state for async operations. */
	loading = $state(false);

	/** Error message, if any. */
	error = $state<string | null>(null);

	/** Currently selected TTS voice for preview. */
	selectedVoice = $state<string>("tara");

	/** Currently selected TTS slot. */
	selectedTtsSlot = $state<string>("voice.tts.primary");

	/** Speech speed multiplier. */
	speechSpeed = $state(1.0);

	/** STT language. */
	sttLanguage = $state("en");

	/** VAD sensitivity. */
	vadSensitivity = $state(0.4);

	/** Set active tab. */
	setTab(tab: VoiceLabTab): void {
		this.activeTab = tab;
	}

	/** Clear error. */
	clearError(): void {
		this.error = null;
	}
}

export const voiceState = new VoiceState();
