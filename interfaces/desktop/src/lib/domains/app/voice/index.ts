/**
 * @file Voice domain — public API (Nx library-types).
 * @domain voice
 */

export { voiceState } from "./data-access/voice.state.svelte.js";
export * from "./data-access/voice.svc.js";
export { default as VoiceLabPanel } from "./feature/lab/VoiceLabPanel.svelte";
export * from "./util/voice.contract.js";
