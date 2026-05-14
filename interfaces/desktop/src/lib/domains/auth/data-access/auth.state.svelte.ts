/**
 * @module @devpulse/domains/auth/data-access/auth.state.svelte
 *
 * Auth state singleton — wraps supabase-js auth surface in Svelte 5
 * runes so any component can read `authState.session` / `authState.user`
 * reactively without owning subscription teardown.
 *
 * Lifecycle:
 *   - `init()` runs once at app boot (from `+layout.svelte`). It calls
 *     `getSupabaseClient()`, reads the persisted session via `getSession()`,
 *     and subscribes to `onAuthStateChange` so subsequent sign-in /
 *     sign-out events in any window propagate into the rune.
 *   - `signIn(email, password)` / `signUp(email, password)` /
 *     `signOut()` mutate the rune via the subscription callback —
 *     never directly. Single source of truth = supabase-js.
 *
 * Why a class with $state-class fields (not module-scoped `let $state`):
 * the layout layer needs to instance-test (`authState instanceof ...`)
 * for SSR/CSR boundaries, AND Svelte 5 `$state.raw` plays nicer when
 * the bag of fields lives on a class instance.
 */

import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { commands } from "$lib/sys/generated/bindings.js";
import { getSupabaseClient, resetSupabaseClient } from "./supabase.client.js";

/**
 * Phase of the auth shell. `pending` = initial session probe in flight;
 * `signed-out` = no session, render login; `signed-in` = render app;
 * `not-configured` = no Supabase anon key yet, render "configure cloud"
 * empty state on the login screen (we still surface a "go to settings"
 * link instead of hard-failing).
 */
export type AuthPhase = "pending" | "signed-out" | "signed-in" | "not-configured";

/** Strongly-typed error surfaced into the UI's `<output role="alert">` region. */
export type AuthError = {
	/** Wire id for switching on in the UI copy table. */
	kind:
		| "credentials-required"
		| "passwords-dont-match"
		| "invalid-credentials"
		| "network"
		| "supabase-not-configured"
		| "unknown";
	/** Optional message detail — used for the `unknown` kind's `{error}` template. */
	detail: string | null;
};

class AuthState {
	/** Current SDK session, or `null` when signed-out. */
	session = $state<Session | null>(null);
	/** Convenience — `session?.user`, surfaced as its own rune so consumers
	 *  reading just `authState.user` don't track changes to other session fields. */
	user = $state<User | null>(null);
	/** Current phase — drives the layout's gate. */
	phase = $state<AuthPhase>("pending");
	/** Last error surfaced to the UI. Cleared on next submit. */
	lastError = $state<AuthError | null>(null);
	/** `true` while a sign-in / sign-up request is in flight — disables
	 *  the submit button + swaps its label to the busy variant. */
	busy = $state(false);

	private unsubscribe: (() => void) | null = null;

	/**
	 * Boot the auth subsystem. Idempotent — calling twice is a no-op so
	 * the layout's `onMount` doesn't need a guard.
	 */
	async init(): Promise<void> {
		if (this.phase !== "pending") return;
		const result = await getSupabaseClient();
		if (result.kind === "not-configured") {
			this.phase = "not-configured";
			return;
		}
		if (result.kind === "error") {
			this.phase = "not-configured";
			this.lastError = { kind: "supabase-not-configured", detail: result.message };
			return;
		}
		const { client } = result;
		const { data, error } = await client.auth.getSession();
		if (error) {
			this.phase = "signed-out";
			this.lastError = { kind: "network", detail: error.message };
			return;
		}
		this.session = data.session;
		this.user = data.session?.user ?? null;
		this.phase = data.session ? "signed-in" : "signed-out";

		const { data: subscription } = client.auth.onAuthStateChange((event, session) =>
			this.handleAuthChange(event, session),
		);
		this.unsubscribe = () => subscription.subscription.unsubscribe();
	}

	/**
	 * Submit the sign-in form. Empty-input check runs locally so the
	 * UI surfaces `credentials-required` without a network round-trip.
	 */
	async signIn(email: string, password: string): Promise<void> {
		this.lastError = null;
		if (!email.trim() || !password) {
			this.lastError = { kind: "credentials-required", detail: null };
			return;
		}
		const result = await getSupabaseClient();
		if (result.kind !== "ready") {
			this.lastError = { kind: "supabase-not-configured", detail: null };
			return;
		}
		this.busy = true;
		try {
			const { error } = await result.client.auth.signInWithPassword({ email, password });
			if (error) {
				this.lastError = this.classifyError(error.message, "invalid-credentials");
			}
		} finally {
			this.busy = false;
		}
	}

	/**
	 * Submit the sign-up form. Caller has already enforced the
	 * confirm-password match — we re-check here for defence in depth.
	 */
	async signUp(email: string, password: string, confirmPassword: string): Promise<void> {
		this.lastError = null;
		if (!email.trim() || !password) {
			this.lastError = { kind: "credentials-required", detail: null };
			return;
		}
		if (password !== confirmPassword) {
			this.lastError = { kind: "passwords-dont-match", detail: null };
			return;
		}
		const result = await getSupabaseClient();
		if (result.kind !== "ready") {
			this.lastError = { kind: "supabase-not-configured", detail: null };
			return;
		}
		this.busy = true;
		try {
			const { data, error } = await result.client.auth.signUp({ email, password });
			if (error) {
				this.lastError = this.classifyError(error.message, "unknown");
				return;
			}
			if (data.user) {
				// Fire-and-forget — analytics shouldn't block UX even if
				// the Tauri command stalls (unlikely; emit is sync-ish).
				commands
					.emitAnalyticsEvent({
						name: "auth-signed-up",
						props: { user_id: data.user.id },
					})
					.catch(() => {});
			}
		} finally {
			this.busy = false;
		}
	}

	/**
	 * Sign out from Supabase. The `onAuthStateChange` callback flips
	 * `phase` to `signed-out` once the SDK confirms the logout — we
	 * don't pre-flip the phase locally (avoids ghost UI when the
	 * network request fails).
	 */
	async signOut(): Promise<void> {
		const result = await getSupabaseClient();
		if (result.kind !== "ready") return;
		this.busy = true;
		try {
			await result.client.auth.signOut();
		} finally {
			this.busy = false;
		}
	}

	/**
	 * Detach the auth listener. Called from the layout's teardown so
	 * dev-mode HMR doesn't leak listeners across reloads.
	 */
	destroy(): void {
		this.unsubscribe?.();
		this.unsubscribe = null;
		resetSupabaseClient();
		this.phase = "pending";
		this.session = null;
		this.user = null;
	}

	private handleAuthChange(event: AuthChangeEvent, session: Session | null): void {
		const previousUserId = this.user?.id ?? null;
		this.session = session;
		this.user = session?.user ?? null;
		this.phase = session ? "signed-in" : "signed-out";
		if (event === "SIGNED_OUT") {
			this.lastError = null;
			if (previousUserId) {
				commands
					.emitAnalyticsEvent({
						name: "auth-signed-out",
						props: { user_id: previousUserId },
					})
					.catch(() => {});
			}
		} else if (event === "SIGNED_IN" && session?.user) {
			commands
				.emitAnalyticsEvent({
					name: "auth-signed-in",
					props: { user_id: session.user.id },
				})
				.catch(() => {});
		}
	}

	private classifyError(message: string, fallback: AuthError["kind"]): AuthError {
		const lower = message.toLowerCase();
		if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
			return { kind: "invalid-credentials", detail: null };
		}
		if (lower.includes("network") || lower.includes("fetch")) {
			return { kind: "network", detail: null };
		}
		return { kind: fallback, detail: message };
	}
}

/** Module-scope singleton — every consumer hits the same instance. */
export const authState = new AuthState();
