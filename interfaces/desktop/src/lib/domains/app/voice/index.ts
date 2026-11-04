/**
 * @file Voice domain — public API (Nx library-types).
 * @domain voice
 */

export {
	VOICE_LAB_DOMAIN,
	VOICE_LAB_FEATURES,
	type VoiceLabFeature,
} from "#lib/sys/contracts/index.js";
export type {
	VoiceSttConfig as VoiceSttConfigDto,
	VoiceTtsConfig as VoiceTtsConfigDto,
} from "#lib/sys/generated/bindings.js";
export * from "./data-access/voice.service.js";
export { voiceState } from "./data-access/voice.state.svelte.js";
export {
	voiceSttConfigState,
	voiceTtsConfigState,
} from "./data-access/voice-config.state.svelte.js";
export { voiceEndpointsState } from "./data-access/voice-endpoints.state.svelte.js";
export { default as VoiceLabPanel } from "./feature/lab/VoiceLabPanel.svelte";
export * from "./util/voice.contract.js";
