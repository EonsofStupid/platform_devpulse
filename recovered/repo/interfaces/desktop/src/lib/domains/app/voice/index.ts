/**
 * @file Voice domain — public API (Nx library-types).
 * @domain voice
 */

export type {
	VoiceSttConfig as VoiceSttConfigDto,
	VoiceTtsConfig as VoiceTtsConfigDto,
} from "$lib/sys/generated/bindings.js";
export { voiceState } from "./data-access/voice.state.svelte.js";
export * from "./data-access/voice.svc.js";
export {
	voiceSttConfigState,
	voiceTtsConfigState,
} from "./data-access/voice-config.state.svelte.js";
export { default as VoiceLabPanel } from "./feature/lab/VoiceLabPanel.svelte";
export * from "./util/voice.contract.js";
