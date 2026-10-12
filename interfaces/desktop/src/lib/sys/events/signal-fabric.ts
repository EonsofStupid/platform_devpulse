/**
 * @file signalFabric — the UI's single subscriber to engine signals.
 * @module @devpulse/sys/events/signal-fabric
 *
 * Rust producers emit typed `Signal`s into the engine's `SignalRouter`.
 * The desktop shell forwards every Broadcast-routed signal as one typed
 * Tauri event (`SignalBroadcast`). This module listens to that event once
 * and dispatches on `signal.payload.type`, so stores receive the variant's
 * payload already narrowed — no string event names, no casts.
 *
 * ```ts
 * const off = signalFabric.on("hardware", (metrics, signal) => {
 *   // metrics: HardwareMetrics; signal.header: provenance
 * });
 * ```
 *
 * The Tauri listener attaches on the first `on()` and stays attached for
 * the app's lifetime; handlers come and go.
 */

import type { UnlistenFn } from "@tauri-apps/api/event";
import { events, type Signal, type SignalVariant } from "$lib/sys/generated/bindings.js";
import { logDebug } from "$lib/sys/logger.js";

/** Discriminant of every signal variant (`"hardware"`, `"system"`, …). */
export type SignalType = SignalVariant["type"];

/** Payload carried by the variant whose discriminant is `T`. */
export type SignalData<T extends SignalType> = Extract<SignalVariant, { type: T }>["data"];

/** Handler for one variant: narrowed payload plus the full signal (its header is the provenance). */
export type SignalHandler<T extends SignalType> = (data: SignalData<T>, signal: Signal) => void;

type AnyHandler = (data: unknown, signal: Signal) => void;

class SignalFabric {
	private readonly handlers = new Map<SignalType, Set<AnyHandler>>();
	private attaching: Promise<UnlistenFn> | null = null;

	/**
	 * Register a handler for one signal variant. Returns the teardown fn —
	 * return it from `$effect` / `onMount` so it runs on unmount.
	 */
	on<T extends SignalType>(type: T, handler: SignalHandler<T>): () => void {
		const set = this.handlers.get(type) ?? new Set<AnyHandler>();
		this.handlers.set(type, set);
		const entry = handler as AnyHandler;
		set.add(entry);
		this.attaching ??= this.attach();
		return () => {
			set.delete(entry);
			if (set.size === 0) this.handlers.delete(type);
		};
	}

	private async attach(): Promise<UnlistenFn> {
		const unlisten = await events.signalBroadcast.listen((event) => {
			this.dispatch(event.payload.signal);
		});
		logDebug("signalFabric", "attached to signal-broadcast");
		return unlisten;
	}

	private dispatch(signal: Signal): void {
		this.handlers.get(signal.payload.type)?.forEach((handler) => {
			handler(signal.payload.data, signal);
		});
	}
}

export const signalFabric = new SignalFabric();
