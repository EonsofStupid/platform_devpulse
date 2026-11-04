/**
 * @file signalFabric — the UI's single subscriber to engine signals.
 * @module @devpulse/sys/events/signal-fabric
 *
 * Rust producers publish typed `Signal`s into the engine. The desktop shell
 * forwards every UI-bound signal as one typed Tauri event (`SignalBroadcast`).
 * This module listens to that event once and dispatches on
 * `signal.payload.type`, so stores receive the variant's payload already
 * narrowed — no string event names, no casts.
 *
 * Two kinds of signal, told apart by `header.revision`:
 *
 * - **Events** (`revision === null`) — something happened; delivered as-is.
 * - **State** (`revision` set) — the latest value of something Rust owns.
 *   Only a newer revision is applied; stale or duplicate ones are dropped, and
 *   a handler that registers late immediately receives the current value.
 *
 * Sync follows the Kubernetes list-then-watch rule: listen first (buffering),
 * read the snapshot (`get_signal_state`), apply it, then flush the buffer. A
 * `resync` signal (the bridge fell behind) re-reads the snapshot.
 *
 * ```ts
 * const off = signalFabric.on("hardware", (metrics, signal) => {
 *   // metrics: HardwareSnapshot (available or unavailable); signal.header: provenance
 * });
 * ```
 */

import { untrack } from "svelte";
import {
	commands,
	events,
	type Signal,
	type SignalKind,
	type SignalVariant,
	type StateSnapshot,
} from "#lib/sys/generated/bindings.js";
import { logDebug, logWarn } from "#lib/sys/logger.js";

/** Discriminant of every signal variant (`"hardware"`, `"system"`, …). */
export type SignalType = SignalVariant["type"];

/** Payload carried by the variant whose discriminant is `T` (`undefined` for data-less kinds). */
export type SignalData<T extends SignalType> =
	Extract<SignalVariant, { type: T }> extends { data: infer D } ? D : undefined;

/** Handler for one kind: narrowed payload plus the full signal (its header is the provenance). */
export type SignalHandler<T extends SignalType> = (data: SignalData<T>, signal: Signal) => void;

type AnyHandler = (data: unknown, signal: Signal) => void;

function payloadData(signal: Signal): unknown {
	return "data" in signal.payload ? signal.payload.data : undefined;
}

/**
 * Pure bookkeeping for state signals: which process run the UI follows and
 * the newest revision applied per kind. No I/O — unit-tested on its own.
 */
export class FabricLedger {
	private epoch: string | null = null;
	private readonly revisions = new Map<SignalType, number>();
	private readonly latest = new Map<SignalType, Signal>();

	/** Apply one live signal. Returns `true` when consumers should receive it. */
	accept(signal: Signal): boolean {
		const revision = signal.header.revision;
		if (revision === null) return true;
		const type = signal.payload.type;
		if (revision <= (this.revisions.get(type) ?? 0)) return false;
		this.revisions.set(type, revision);
		this.latest.set(type, signal);
		return true;
	}

	/**
	 * Apply a snapshot. A different epoch means the copy held belongs to an
	 * earlier process run and is discarded first. Returns the signals
	 * consumers should receive, oldest revision first.
	 */
	acceptSnapshot(snapshot: StateSnapshot): Signal[] {
		if (snapshot.epoch !== this.epoch) {
			this.epoch = snapshot.epoch;
			this.revisions.clear();
			this.latest.clear();
		}
		return snapshot.signals.filter((signal) => this.accept(signal));
	}

	/** Current value of a state kind, if one has been applied. */
	latestOf(type: SignalType): Signal | undefined {
		return this.latest.get(type);
	}
}

class SignalFabric {
	private readonly ledger = new FabricLedger();
	private readonly handlers = new Map<SignalType, Set<AnyHandler>>();
	private attached = false;
	private syncing = false;
	private buffered: Signal[] = [];

	/**
	 * Register a handler for one signal kind. A state kind's current value is
	 * delivered immediately. Returns the teardown fn — return it from
	 * `$effect` / `onMount` so it runs on unmount. The first handler of a kind
	 * tells Rust someone is watching it; the last one leaving says no one is.
	 */
	on<T extends SignalType>(type: T, handler: SignalHandler<T>): () => void {
		const set = this.handlers.get(type) ?? new Set<AnyHandler>();
		if (set.size === 0) void commands.setSignalInterest(type as SignalKind, true);
		this.handlers.set(type, set);
		const entry = handler as AnyHandler;
		set.add(entry);
		if (!this.attached) {
			this.attached = true;
			void this.attach();
		}

		// Callers subscribe from `$effect`, so this runs inside it. What a handler
		// reads must not become that effect's dependency: a store that reads and
		// writes its own state here would re-run the effect, re-subscribe and be
		// replayed to, until Svelte stops the page.
		const current = this.ledger.latestOf(type);
		if (current) untrack(() => entry(payloadData(current), current));

		return () => {
			set.delete(entry);
			if (set.size === 0) {
				this.handlers.delete(type);
				void commands.setSignalInterest(type as SignalKind, false);
			}
		};
	}

	private async attach(): Promise<void> {
		this.syncing = true;
		await events.signalBroadcast.listen((event) => {
			this.receive(event.payload.signal);
		});
		logDebug("signalFabric", "listening to signal-broadcast");
		await this.resync();
	}

	private receive(signal: Signal): void {
		if (signal.payload.type === "resync") {
			void this.resync();
			return;
		}
		if (this.syncing) {
			this.buffered.push(signal);
			return;
		}
		if (this.ledger.accept(signal)) this.dispatch(signal);
	}

	/** Read the snapshot, apply it, then apply whatever arrived meanwhile. */
	private async resync(): Promise<void> {
		this.syncing = true;
		try {
			const snapshot = await commands.getSignalState();
			this.ledger.acceptSnapshot(snapshot).forEach((signal) => {
				this.dispatch(signal);
			});
			logDebug(
				"signalFabric",
				`snapshot applied (revision ${snapshot.revision}, ${snapshot.signals.length} state signals)`,
			);
		} catch (err) {
			logWarn("signalFabric", `snapshot failed — continuing on live signals: ${String(err)}`);
		} finally {
			const pending = this.buffered;
			this.buffered = [];
			this.syncing = false;
			pending.forEach((signal) => {
				if (this.ledger.accept(signal)) this.dispatch(signal);
			});
		}
	}

	private dispatch(signal: Signal): void {
		this.handlers.get(signal.payload.type)?.forEach((handler) => {
			handler(payloadData(signal), signal);
		});
	}
}

export const signalFabric = new SignalFabric();
