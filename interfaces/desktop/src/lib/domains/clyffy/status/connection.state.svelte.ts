/**
 * @file clyffyConnection — gb10-client wire connection state (ref-counted rune).
 * @module @devpulse/domains/clyffy/status/connection
 *
 * The single source of truth for "is the AI layer (headless Clyffy on the
 * GB10) reachable?" DevPulse runs standalone (Tier-1, Turso only) when it is
 * not; the AI layer is a CONNECTION, not a local component, so "Standalone" is
 * a valid mode, never an error.
 *
 * Everything here is COMPUTED from the endpoint handshake — never hardcoded.
 * `tier2Available` drives the no-AI indicator; `slots` exposes exactly what the
 * connected endpoint advertised in its capability, so Tier-2 surfaces light up
 * as a pure function of what Clyffy actually serves.
 *
 * Ref-counted: the underlying `clyffy-connection-changed` subscription attaches
 * on the first `subscribe()` and detaches when the last subscriber drops, and a
 * one-shot `connection_status` fetch catches the caller up to the probe task's
 * current state before the next event tick.
 *
 * ```svelte
 * import { clyffyConnection } from "$lib/domains/clyffy/status/connection.state.svelte.js";
 * $effect(() => clyffyConnection.subscribe());
 * ```
 */

import {
	type ConnectionState,
	commands,
	type LoadedSlotSummary,
} from "$lib/sys/generated/bindings.js";
import { logError } from "$lib/sys/logger.js";
import { clyffyEvents } from "$lib/sys/streams/tauri-event.svelte.js";

class ClyffyConnection {
	#state = $state<ConnectionState>({ state: "disconnected" });

	private refCount = 0;
	private cleanup: (() => void) | null = null;

	/** Raw wire state — `disconnected` / `connecting` / `connected`. */
	get state(): ConnectionState {
		return this.#state;
	}

	/**
	 * Whether the Tier-2 (AI) layer is live over the wire. The no-AI indicator
	 * shows while this is `false` and clears when it flips `true`. Mirrors the
	 * Rust `ConnectionState::tier2_available()`.
	 */
	get tier2Available(): boolean {
		return this.#state.state === "connected";
	}

	/** Endpoint URL while connecting/connected, else `null`. */
	get endpointUrl(): string | null {
		return this.#state.state === "disconnected" ? null : this.#state.url;
	}

	/**
	 * Loaded-slot summaries the connected endpoint advertised (empty when not
	 * connected). Tier-2 surfaces gate off this — capability-computed, never a
	 * hardcoded slot table.
	 */
	get slots(): LoadedSlotSummary[] {
		return this.#state.state === "connected" ? this.#state.capability.slots : [];
	}

	/**
	 * Subscribe to the wire connection. Returns a teardown fn that MUST be
	 * called on unmount (return it from `$effect` / `onMount`).
	 */
	subscribe(): () => void {
		this.refCount += 1;
		if (this.refCount === 1) {
			// One-shot catch-up so the indicator reflects the probe task's
			// current state immediately, before the next transition event.
			void commands.connectionStatus().then((r) => {
				if (r.status === "ok") {
					this.#state = r.data;
				} else {
					logError("clyffy.connection", `connection_status failed: ${String(r.error)}`);
				}
			});
			this.cleanup = clyffyEvents.connectionChanged.handle((payload) => {
				this.#state = payload.connection;
			});
		}
		return () => {
			this.refCount -= 1;
			if (this.refCount === 0) {
				this.cleanup?.();
				this.cleanup = null;
			}
		};
	}
}

/** App-wide singleton — every no-AI indicator + Tier-2 gate reads this. */
export const clyffyConnection = new ClyffyConnection();
