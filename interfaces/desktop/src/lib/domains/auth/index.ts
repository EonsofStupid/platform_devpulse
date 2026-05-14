/**
 * @module @devpulse/domains/auth
 *
 * Public API for the auth domain. The Supabase-backed sign-in / sign-up
 * surface lives here as `authState` (rune singleton) + the supabase-js
 * client accessor. Routes and other domains MUST import from this file —
 * never reach into `data-access/` directly.
 */

export {
	type AuthError,
	type AuthPhase,
	authState,
} from "./data-access/auth.state.svelte.js";
export {
	getSupabaseClient,
	resetSupabaseClient,
	type SupabaseClientResult,
} from "./data-access/supabase.client.js";
export { default as LoginShell } from "./feature/LoginShell.svelte";
