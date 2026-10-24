/**
 * @file RRD lifecycle state
 * @module @devpulse/sys/data-access/rrd
 *
 * Subscribes to `platform:rrd-phase-transition` and keeps a rolling
 * history of the kernel daemon's lifecycle events (pause / drain /
 * load / validate / swap / resume / fail). Powers the RRD devtool's
 * Status + Logs tabs.
 *
 * The Tauri event is bridged from the kernel via the
 * RrdLifecycleTranslator → InternalEvent::RrdPhaseTransition path
 * wired in lib.rs. See HOT_UPDATE_PATTERN.md §11.
 */

import { listen } from "@tauri-apps/api/event";

export interface RrdTransition {
	/** Phase identifier — one of the constants in `rrd_lifecycle_phase`. */
	phase: string;
	/** Human-readable summary (encoder path, validation error, elapsed drain time). */
	detail: string;
	/** Wall-clock time when the frontend received the event. */
	receivedAtMs: number;
}

/**
 * Rolling history cap. Bigger than the daemon's typical pause →
 * resume cycle (~10 phases) so the user can scroll back through a
 * couple cycles without losing context, but small enough that the
 * devtool stays snappy. Older entries get evicted FIFO.
 */
const HISTORY_CAP = 200;

class RrdState {
	transitions = $state<RrdTransition[]>([]);
	private booted = false;

	/** Most recent transition, or `null` if no events have arrived yet. */
	get last(): RrdTransition | null {
		const xs = this.transitions;
		return xs.length === 0 ? null : xs[xs.length - 1];
	}

	/** Has any transition been seen this session? */
	get hasHistory(): boolean {
		return this.transitions.length > 0;
	}

	/** Wire up the Tauri event listener. Idempotent. */
	async boot(): Promise<void> {
		if (this.booted) return;
		this.booted = true;

		await listen<{ phase: string; detail: string }>("platform:rrd-phase-transition", (event) => {
			const { phase, detail } = event.payload;
			const next = [...this.transitions, { phase, detail, receivedAtMs: Date.now() }];
			// FIFO eviction when over the cap.
			this.transitions = next.length > HISTORY_CAP ? next.slice(next.length - HISTORY_CAP) : next;
		});
	}

	/** Wipe the rolling history. Used by the devtool's Actions tab. */
	clear(): void {
		this.transitions = [];
	}
}

export const rrdState = new RrdState();
