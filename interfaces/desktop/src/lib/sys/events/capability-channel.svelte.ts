/**
 * @file capability-channel — reactive Svelte store keyed by slot
 *       capability handle (`voice.stt`, `voice.tts`, `vision.embedder`,
 *       `chat.brain`, …).
 *
 * Subscribes to the engine's full slot lifecycle so consumers don't
 * have to reach into `modelsState.statuses` for the granular state
 * (downloading, loading-with-progress, failed, unloading, …). Tracks
 * a single `stage` enum that mirrors what the user actually wants on
 * a per-slot UI — plus the runtime fingerprint that uniquely
 * identifies *which* engine is fulfilling the slot.
 *
 * Wire events handled:
 *   • `model:loading-started`           → stage = "loading"
 *   • `model:loading-stage`             → loading_progress updates
 *   • `model:loading-complete`          → stage = "loaded"
 *   • `model:loading-failed`            → stage = "failed", error set
 *   • `model:unload-complete`           → stage = "idle"
 *   • `model:capability-rebound`        → runtime_id updates
 *   • `model:runtime-version-changed`   → fingerprint updates
 *
 * Singleton-per-capability: `capabilityChannel("voice.tts")` returns
 * the same `CapabilityState` instance for every caller, so all
 * mounted devtools / chat surfaces see the same live snapshot.
 *
 * On first access, hydrates from `list_runtime_fingerprints` so
 * already-loaded slots show their runtime + `stage = "loaded"`
 * immediately rather than waiting for a reload event.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { capabilityChannel } from "$lib/sys/events";
 *   const tts = capabilityChannel("voice.tts");
 * </script>
 * {#if tts.stage === "loading"}
 *   Loading… {tts.loading_progress?.toFixed(0) ?? "—"}%
 * {:else if tts.stage === "failed"}
 *   <em>{tts.error}</em>
 * {:else if tts.stage === "loaded"}
 *   Ready · {tts.current_runtime}
 * {/if}
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
 * into a TS type on its own. When a "rebind history" command
 * lands this constant moves to the generated bindings file.
 */
export type RebindReason = "initial_load" | "user_swap" | "fallback" | "hot_update";

/**
 * Per-capability lifecycle stage. Maps directly to the slot's load
 * state from the user's mental model — "what's this slot doing right
 * now?" — without exposing the full `ModelStatus` enum from the
 * model loader.
 *
 * `idle`         — no model in flight; slot is empty or unloaded.
 * `loading`      — weights being read from disk into memory.
 *                  `loading_progress` is populated 0..100.
 * `loaded`       — runtime is alive and serving inference.
 *                  `current_runtime` + `current_fingerprint` are set.
 * `unloading`    — teardown in progress.
 * `failed`       — last load attempt errored. `error` carries the
 *                  message; the slot is effectively idle until
 *                  reloaded.
 *
 * `downloading` is intentionally out of scope here — model files
 * live in the registry, not the slot, and a download isn't bound to
 * a capability until the file is assigned. The `downloads` channel
 * (separate concern) tracks per-download progress.
 */
export type CapabilityStage = "idle" | "loading" | "loaded" | "unloading" | "failed";

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
 * Reactive snapshot of one capability slot's lifecycle. Mounts on
 * first call to [`capabilityChannel`] and stays alive for the
 * process lifetime.
 */
export class CapabilityState {
	/** Coarse lifecycle state — drives most UI conditionals. */
	stage = $state<CapabilityStage>("idle");
	/** Currently-loaded `runtime_id`, or `null` if no slot is loaded. */
	current_runtime = $state<string | null>(null);
	/** Full fingerprint of the currently-loaded runtime. */
	current_fingerprint = $state<RuntimeFingerprint | null>(null);
	/**
	 * Loading progress in `[0, 100]` while `stage === "loading"`.
	 * `null` outside loading windows.
	 */
	loading_progress = $state<number | null>(null);
	/**
	 * Most-recent loading stage label from the engine — `Allocating`,
	 * `LoadingWeights`, `Verifying`, etc. Useful for "Loading…
	 * Verifying" subtitles. `null` when not loading.
	 */
	loading_stage_label = $state<string | null>(null);
	/**
	 * Error message from the last failed load attempt. Cleared on
	 * the next `loading-started`. `null` when no failure is current.
	 */
	error = $state<string | null>(null);
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

	/**
	 * Convenience boolean — `true` iff the runtime is alive and
	 * serving inference. Same shape as the prior `isInferenceReady`
	 * helper from `models/util/models.types.ts`, kept here so devtool
	 * pages don't need to know about the lifecycle enum to ask the
	 * most-asked question.
	 */
	get ready(): boolean {
		return this.stage === "loaded" && this.current_runtime !== null;
	}
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

interface LoadingStartedPayload {
	slot_id: string;
	model_id: string;
}

interface LoadingStagePayload {
	slot_id: string;
	stage: string;
	progress_pct: number;
}

interface LoadingCompletePayload {
	slot_id: string;
	ram_mb: number;
	vram_mb: number;
}

interface LoadingFailedPayload {
	slot_id: string;
	error: string;
}

interface UnloadCompletePayload {
	slot_id: string;
	freed_ram_mb: number;
	freed_vram_mb: number;
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
		listen<LoadingStartedPayload>("model:loading-started", (e) => {
			if (e.payload.slot_id !== capability) return;
			state.stage = "loading";
			state.loading_progress = 0;
			state.loading_stage_label = "Allocating";
			state.error = null;
		}),
		listen<LoadingStagePayload>("model:loading-stage", (e) => {
			if (e.payload.slot_id !== capability) return;
			if (state.stage === "loading") {
				state.loading_progress = e.payload.progress_pct;
				state.loading_stage_label = e.payload.stage;
			}
		}),
		listen<LoadingCompletePayload>("model:loading-complete", (e) => {
			if (e.payload.slot_id !== capability) return;
			state.stage = "loaded";
			state.loading_progress = null;
			state.loading_stage_label = null;
		}),
		listen<LoadingFailedPayload>("model:loading-failed", (e) => {
			if (e.payload.slot_id !== capability) return;
			state.stage = "failed";
			state.loading_progress = null;
			state.loading_stage_label = null;
			state.error = e.payload.error;
		}),
		listen<UnloadCompletePayload>("model:unload-complete", (e) => {
			if (e.payload.slot_id !== capability) return;
			state.stage = "idle";
			state.current_runtime = null;
			state.current_fingerprint = null;
			state.loading_progress = null;
			state.loading_stage_label = null;
			state.error = null;
		}),
	]);

	channels.set(capability, { state, unlistens });

	// Hydrate from the engine — fire-and-forget. Failure leaves
	// `hydrated = false` and `stage = "idle"` until the next real
	// load event lands; not fatal.
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
			// A fingerprint exists ⇒ a load completed in this session;
			// stage is "loaded" until the next loading-* event lands.
			state.stage = "loaded";
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
