/**
 * @file voice-selection.state.svelte.ts — cross-devtool selection rune.
 * @module @devpulse/devtools/_shared
 *
 * STT, TTS, and STS devtools share a single selected-voice value so a
 * preview in TTS persists into a smoke test in STS without bouncing
 * through props. Held here (not in a per-devtool data-access folder)
 * because the coupling is genuinely cross-devtool.
 */

class VoiceSelectionState {
	/** Currently selected TTS voice id (e.g. `qwen3:ryan`, `custom:foo`, `af_heart`). */
	selectedVoice = $state<string>("af_heart");

	/** Slot id the active TTS uses — stays as `voice.tts` unless multi-slot lands. */
	selectedTtsSlot = $state<string>("voice.tts");
}

export const voiceSelectionState = new VoiceSelectionState();
