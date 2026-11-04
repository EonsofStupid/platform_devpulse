/**
 * @file Tauri Event Stream — reusable rune-based wrapper for Tauri events.
 * @module @devpulse/sys/streams/tauri-event
 *
 * Turns an imperative `listen(name, cb) -> unlisten` dance into a
 * declarative rune that any consumer can subscribe to inside an
 * `$effect` block. Cleanup is automatic: when the effect tears down,
 * the handler unregisters. When the last handler drops, the
 * underlying Tauri `unlisten` fires.
 *
 * This is the SINGLE subscription boundary for Tauri events. Per
 * `sys/streams/README.md`, domains MUST NOT call `listen()` directly.
 *
 * Usage:
 * ```ts
 * const loading = createTauriEvent<{ slot_id: string }>("model:loading-started");
 *
 * // Inside a component OR inside $effect.root:
 * $effect(() => loading.handle((payload) => {
 *   // react to payload
 * }));
 * ```
 */

import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { log, logError } from "#lib/sys/logger.js";

export interface TauriEventStream<T> {
	/** Register a handler. Returns a cleanup fn — wire into `$effect` return. */
	handle(callback: (payload: T) => void): () => void;
	/** Number of active handlers. Reactive. */
	readonly subscriberCount: number;
}

/**
 * Create a reusable Tauri event stream. One `listen()` call is made
 * lazily on first subscribe, and one `unlisten()` call fires when the
 * last handler drops. Safe to re-subscribe; safe across HMR.
 *
 * @param eventName The Tauri event name (e.g. `"model:loading-started"`).
 */
export function createTauriEvent<T>(eventName: string): TauriEventStream<T> {
	// Plain Set — NOT $state. Reassigning a $state Set inside handle()
	// triggers effect re-evaluation which calls the cleanup which
	// reassigns again → effect_update_depth_exceeded. The Set is
	// internal bookkeeping; only subscriberCount needs reactivity.
	const handlers = new Set<(payload: T) => void>();
	let count = $state(0);
	let unlisten: UnlistenFn | null = null;
	let attaching: Promise<void> | null = null;

	async function attach(): Promise<void> {
		if (unlisten || attaching) {
			await attaching;
			return;
		}
		attaching = (async () => {
			try {
				unlisten = await listen<T>(eventName, (event) => {
					// Verbatim dev logging — every Tauri event receipt
					// lands in the session JSONL with its payload. Safe
					// in release; the Rust pipeline filters DEBUG there.
					let payloadPreview: string;
					try {
						const s = JSON.stringify(event.payload ?? null);
						payloadPreview = s.length > 500 ? `${s.slice(0, 500)}…` : s;
					} catch {
						payloadPreview = "<unserializable>";
					}
					log(
						"debug",
						"frontend:event",
						`${eventName} → ${handlers.size} handler(s) payload=${payloadPreview}`,
					);
					handlers.forEach((fn) => {
						fn(event.payload);
					});
				});
			} catch (e) {
				logError(
					"sys.streams.tauri-event",
					`failed to attach ${eventName}: ${e instanceof Error ? e.message : String(e)}`,
				);
			} finally {
				attaching = null;
			}
		})();
		await attaching;
	}

	function detach(): void {
		if (!unlisten) return;
		try {
			unlisten();
		} catch (e) {
			logError(
				"sys.streams.tauri-event",
				`failed to detach ${eventName}: ${e instanceof Error ? e.message : String(e)}`,
			);
		}
		unlisten = null;
	}

	return {
		handle(callback: (payload: T) => void): () => void {
			handlers.add(callback);
			count = handlers.size;
			if (handlers.size === 1) {
				void attach();
			}
			return () => {
				handlers.delete(callback);
				count = handlers.size;
				if (handlers.size === 0) {
					detach();
				}
			};
		},
		get subscriberCount(): number {
			return count;
		},
	};
}

/**
 * Shared singleton streams for commonly-consumed Tauri events.
 *
 * Use these instead of calling `createTauriEvent(name)` per consumer
 * so all subscribers share one underlying `listen()` call.
 */
export const modelEvents = {
	loadingStarted: createTauriEvent<{ slot_id: string; model_id: string }>("model:loading-started"),
	loadingStage: createTauriEvent<{ slot_id: string; stage: string; progress_pct: number }>(
		"model:loading-stage",
	),
	loadingComplete: createTauriEvent<{
		slot_id: string;
		ram_mb: number;
		vram_mb: number;
	}>("model:loading-complete"),
	loadingFailed: createTauriEvent<{ slot_id: string; error: string }>("model:loading-failed"),
	swapStarted: createTauriEvent<{ slot_id: string }>("model:swap-started"),
	swapComplete: createTauriEvent<{ slot_id: string }>("model:swap-complete"),
	downloadStarted: createTauriEvent<{ download_id: string; repo_id: string }>(
		"model:download-started",
	),
	downloadComplete: createTauriEvent<{ download_id: string; model_id: string; filename: string }>(
		"model:download-complete",
	),
	downloadFailed: createTauriEvent<{ download_id: string; error: string }>("model:download-failed"),
} as const;

export const inferenceEvents = {
	started: createTauriEvent<{ slot_id: string }>("inference:started"),
	complete: createTauriEvent<{ slot_id: string }>("inference:complete"),
} as const;
