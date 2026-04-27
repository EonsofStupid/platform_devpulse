/**
 * @file capability-channel — reactive Svelte store keyed by slot
 *       capability handle (`voice.stt`, `voice.tts`, `vision.embedder`,
 *       `chat.brain`, …).
 *
 * Subscribes to two Tauri events forwarded by the engine bridge:
 *   • `model:capability-rebound`        — fired when a slot's
 *     `runtime_id` changes (sherpa → whisper, kokoro → qwen3-tts, …)
 *     OR on first load of the slot in this session.
 *   • `model:runtime-version-changed`   — fired when the same
 *     `runtime_id` reports a different `crate_version` /
 *     `upstream_revision` / `model_revision`.
 *
 * Singleton-per-capability: `capabilityChannel("voice.tts")` returns
 * the same `CapabilityState` instance for every caller, so all
 * mounted devtools / chat surfaces see the same live snapshot.
 *
 * On first access, hydrates from the engine's
 * `list_runtime_fingerprints` command so already-loaded slots show
 * their runtime immediately rather than waiting for the next
 * reload event.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { capabilityChannel } from "$lib/sys/events";
 *   const tts = capabilityChannel("voice.tts");
 * </script>
 * <p>Loaded runtime: {tts.current_runtime ?? "(none)"}</p>
 * <p>Crate version: {tts.current_fingerprint?.crate_version ?? "—"}</p>
 * ```
 */

import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { RuntimeFingerprint } from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";

/**
 * Why a capability rebind happened.
 *
 * SSOT: `kernel/model-loader/src/traits/events.rs` →
 * `enum RebindReason`. Hand-defined here because no Tauri
 * command currently returns this type — the variant flows in
 * over the `model:capability-rebound` Tauri event payload as a
 * snake_case string literal, which `tauri-specta` doesn't lift
 * into a TS type on its own. When Phase 5 adds a "rebind history"
 * command this constant moves to the generated bindings file.
 */
export type RebindReason = "initial_load" | "user_swap" | "fallback" | "hot_update";

/** Last rebind seen on this capability channel. */
export interface RebindRecord {
	/** Previous runtime, if any. */
	from: string | null;
	/** Newly active runtime. */
	to: string;
	/** Why the rebind happened. */
	reason: RebindReason;
	/** `Date.now()` at the time the event arrived on the JS side. */
	at: number;
}

/** Last version-change seen on this capability channel. */
export interface VersionChangeRecord {
	/** Fingerprint at the previous load (or `null` for first load). */
	old: RuntimeFingerprint | null;
	/** Fingerprint at the current load. */
	new: RuntimeFingerprint;
	/** `Date.now()` at the time the event arrived on the JS side. */
	at: number;
}

/**
 * Reactive snapshot of which runtime fulfills a capability slot,
 * plus the most-recent rebind / version-change records for UI
 * activity surfaces.
 */
export class CapabilityState {
	/** Currently-loaded `runtime_id`, or `null` if no slot is loaded. */
	current_runtime = $state<string | null>(null);
	/** Full fingerprint of the currently-loaded runtime. */
	current_fingerprint = $state<RuntimeFingerprint | null>(null);
	/** Last rebind event observed for this capability. */
	last_rebind = $state<RebindRecord | null>(null);
	/** Last version-change event observed for this capability. */
	last_version_change = $state<VersionChangeRecord | null>(null);
	/**
	 * Number of rebinds observed in the current process lifetime.
	 * Useful for "Activity" tabs to show "Sherpa was swapped 3 times
	 * this session".
	 */
	rebind_count = $state(0);
	/** Whether `list_runtime_fingerprints` has run yet. */
	hydrated = $state(false);
}

interface ReboundPayload {
	capability: string;
	from_runtime: string | null;
	to_runtime: string;
	reason: RebindReason;
}

interface VersionChangedPayload {
	runtime_id: string;
	old_fingerprint: RuntimeFingerprint | null;
	new_fingerprint: RuntimeFingerprint;
}

interface ChannelEntry {
	state: CapabilityState;
	/** Pending unlisten promise — kept so we don't dual-subscribe. */
	unlistens: Promise<UnlistenFn[]>;
}

/** Module-scoped registry — one channel per capability. */
const channels = new Map<string, ChannelEntry>();

/**
 * Get or create the reactive channel for a capability.
 *
 * The first call for a given capability starts the Tauri event
 * listeners and kicks off hydration; subsequent calls return the
 * same `CapabilityState` instance.
 */
export function capabilityChannel(capability: string): CapabilityState {
	const existing = channels.get(capability);
	if (existing) return existing.state;

	const state = new CapabilityState();

	const unlistens = Promise.all([
		listen<ReboundPayload>("model:capability-rebound", (e) => {
			if (e.payload.capability !== capability) return;
			state.current_runtime = e.payload.to_runtime;
			state.last_rebind = {
				from: e.payload.from_runtime,
				to: e.payload.to_runtime,
				reason: e.payload.reason,
				at: Date.now(),
			};
			state.rebind_count += 1;
		}),
		listen<VersionChangedPayload>("model:runtime-version-changed", (e) => {
			if (e.payload.runtime_id !== state.current_runtime) return;
			state.current_fingerprint = e.payload.new_fingerprint;
			state.last_version_change = {
				old: e.payload.old_fingerprint,
				new: e.payload.new_fingerprint,
				at: Date.now(),
			};
		}),
	]);

	channels.set(capability, { state, unlistens });

	// Hydrate from the engine — fire-and-forget. Failure leaves
	// `hydrated = false` and `current_runtime = null` until the next
	// real load event lands; not fatal.
	void hydrate(capability, state);

	return state;
}

async function hydrate(capability: string, state: CapabilityState): Promise<void> {
	try {
		const r = await commands.listRuntimeFingerprints();
		if (r.status !== "ok") {
			console.warn(`[capabilityChannel] hydrate failed for ${capability}:`, r.error);
			state.hydrated = true;
			return;
		}
		const fp = r.data[capability];
		if (fp) {
			state.current_runtime = fp.runtime_id;
			state.current_fingerprint = fp;
		}
		state.hydrated = true;
	} catch (e) {
		console.warn(`[capabilityChannel] hydrate threw for ${capability}:`, e);
		state.hydrated = true;
	}
}

/**
 * Tear down a capability channel — used in tests + hot-reload
 * scenarios. Production app never calls this; channels persist
 * for the process lifetime.
 */
export async function disposeCapabilityChannel(capability: string): Promise<void> {
	const entry = channels.get(capability);
	if (!entry) return;
	const unlisten_fns = await entry.unlistens;
	for (const fn of unlisten_fns) {
		fn();
	}
	channels.delete(capability);
}
