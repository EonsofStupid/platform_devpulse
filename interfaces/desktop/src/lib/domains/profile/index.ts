/**
 * @module @devpulse/domains/profile
 *
 * Post-login profile domain — Clyffy's encoder/embedder picker and
 * the minion auto-managed section.
 */

export {
	type ProfileApplyPhase,
	profileState,
} from "./data-access/profile.state.svelte.js";
export { default as EmbedderPicker } from "./feature/EmbedderPicker.svelte";
