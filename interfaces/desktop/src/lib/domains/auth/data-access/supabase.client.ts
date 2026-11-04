/**
 * @module @devpulse/domains/auth/data-access/supabase.client
 *
 * Lazy supabase-js client singleton. Initialised once on first call to
 * `getSupabaseClient()` after the URL + anon key are loaded from the
 * OS keychain via the `get_supabase_credentials` Tauri command.
 *
 * Why lazy: the anon key isn't in the keychain until the operator runs
 * setup once, so we can't construct the client at module-load time.
 * Returning `null` lets the auth UI render an "isn't configured yet"
 * state instead of crashing on a null key.
 *
 * The URL is a deployment constant baked into `secrets.rs`. The anon
 * key is public-by-design (supabase-js ships it to browsers, RLS
 * policies enforce access) so returning the raw value from Rust to TS
 * is the intended pattern — see `secrets.rs` module docstring.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { commands } from "#lib/sys/generated/bindings.js";

/** Cached singleton. Re-creating the client on every call would lose
 *  the in-memory auth state + subscription handles. */
let cached: SupabaseClient | null = null;

/** `Some(client)` after successful first-init, `null` while the anon
 *  key is missing from the keychain. Callers MUST handle the null case
 *  with a "configure Supabase" empty state — never throw. */
export type SupabaseClientResult =
	| { kind: "ready"; client: SupabaseClient }
	| { kind: "not-configured"; url: string }
	| { kind: "error"; message: string };

/**
 * Resolve the supabase-js client. Returns the same instance on every
 * subsequent call.
 *
 * - `ready`            — anon key present, client live.
 * - `not-configured`   — anon key missing; UI shows configure-CTA.
 * - `error`            — keychain access failed (rare; OS-level).
 */
export async function getSupabaseClient(): Promise<SupabaseClientResult> {
	if (cached) {
		return { kind: "ready", client: cached };
	}
	const result = await commands.getSupabaseCredentials();
	if (result.status === "error") {
		return { kind: "error", message: result.error.message };
	}
	const { url, anonKey } = result.data;
	if (!anonKey) {
		return { kind: "not-configured", url };
	}
	cached = createClient(url, anonKey, {
		auth: {
			// Persist the session in the OS-default storage (localStorage in
			// the Tauri webview). The Tauri runtime survives webview reloads
			// so the session keeps until explicit sign-out or token expiry.
			persistSession: true,
			autoRefreshToken: true,
			detectSessionInUrl: false,
		},
	});
	return { kind: "ready", client: cached };
}

/**
 * Reset the cached client — used after the operator clears the anon
 * key via the Cloud settings devtool. Next call to `getSupabaseClient`
 * re-reads from the keychain.
 */
export function resetSupabaseClient(): void {
	cached = null;
}
