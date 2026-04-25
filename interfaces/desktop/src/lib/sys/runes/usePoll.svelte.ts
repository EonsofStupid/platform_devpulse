/**
 * @file sys/runes/usePoll.svelte.ts
 * @module @devpulse/sys/runes/usePoll
 * @description `useTauriQuery` + `setInterval` — the canonical pattern for
 * "fetch this status every N ms while the tab is visible." Replaces the
 * `$effect(() => { void fetch(); const id = setInterval(fetch, ms);
 *  return () => clearInterval(id); })` boilerplate scattered across devtools.
 *
 * Pauses automatically when `document.visibilityState === "hidden"` (default).
 * Pass `pauseWhenHidden: false` to keep polling in the background.
 *
 * MUST be instantiated during a component's synchronous setup so the
 * registered `$effect` cleans up on unmount.
 */

import type { CommandError } from "$lib/sys/generated/bindings.js";
import type { SpectaThunk } from "./_shared.js";
import { TauriQuery, type TauriQueryOptions } from "./useTauriQuery.svelte.js";

export interface PollOptions extends TauriQueryOptions {
	/** Pause polling when the document is hidden. Default true. */
	pauseWhenHidden?: boolean;
}

export class PolledQuery<T, E = CommandError> {
	readonly query: TauriQuery<T, E>;
	paused = $state<boolean>(false);

	private readonly intervalMs: number;
	private readonly pauseWhenHidden: boolean;
	private timer: ReturnType<typeof setInterval> | null = null;

	constructor(thunk: SpectaThunk<T, E>, intervalMs: number, options: PollOptions = {}) {
		this.intervalMs = intervalMs;
		this.pauseWhenHidden = options.pauseWhenHidden ?? true;
		this.query = new TauriQuery(thunk, { initialFetch: options.initialFetch });

		$effect(() => {
			const onVisibility = () => {
				if (!this.pauseWhenHidden) return;
				if (document.visibilityState === "hidden") {
					this.stopTimer();
				} else if (!this.paused) {
					this.startTimer();
					void this.query.refresh();
				}
			};

			if (this.pauseWhenHidden && typeof document !== "undefined") {
				document.addEventListener("visibilitychange", onVisibility);
			}

			if (!this.shouldPause()) this.startTimer();

			return () => {
				if (this.pauseWhenHidden && typeof document !== "undefined") {
					document.removeEventListener("visibilitychange", onVisibility);
				}
				this.stopTimer();
			};
		});
	}

	get data(): T | null {
		return this.query.data;
	}
	get error(): E | null {
		return this.query.error;
	}
	get loading(): boolean {
		return this.query.loading;
	}
	get lastFetchedAt(): number | null {
		return this.query.lastFetchedAt;
	}

	refresh(): Promise<void> {
		return this.query.refresh();
	}

	pause(): void {
		this.paused = true;
		this.stopTimer();
	}

	resume(): void {
		this.paused = false;
		if (!this.shouldPause()) {
			this.startTimer();
			void this.query.refresh();
		}
	}

	private shouldPause(): boolean {
		if (this.paused) return true;
		if (this.pauseWhenHidden && typeof document !== "undefined") {
			return document.visibilityState === "hidden";
		}
		return false;
	}

	private startTimer(): void {
		if (this.timer !== null) return;
		this.timer = setInterval(() => {
			void this.query.refresh();
		}, this.intervalMs);
	}

	private stopTimer(): void {
		if (this.timer !== null) {
			clearInterval(this.timer);
			this.timer = null;
		}
	}
}
