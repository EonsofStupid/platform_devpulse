/**
 * @file sys/runes/useTauriQuery.svelte.ts
 * @module @devpulse/sys/runes/useTauriQuery
 * @description Single canonical "fetch from backend, hold result, surface
 * loading + error" rune. Replaces the per-devtool `let data = $state(null);
 * let loading = $state(false); let error = $state(null);` pattern.
 *
 * Auto-fires once on construction (override with `initialFetch: false`).
 * Cancellation token: late-arriving completions from a stale fetch are
 * dropped, so rapid `refresh()` calls cannot race the UI into showing an
 * older payload after a newer one already landed.
 */

import type { CommandError } from "$lib/sys/generated/bindings.js";
import { type SpectaThunk, toCommandError } from "./_shared.js";

export interface TauriQueryOptions {
	/** Skip the constructor-time fetch — call `refresh()` manually instead. */
	initialFetch?: boolean;
}

export class TauriQuery<T, E = CommandError> {
	data = $state<T | null>(null);
	error = $state<E | null>(null);
	loading = $state<boolean>(false);
	lastFetchedAt = $state<number | null>(null);

	private readonly thunk: SpectaThunk<T, E>;
	private token = 0;

	constructor(thunk: SpectaThunk<T, E>, options: TauriQueryOptions = {}) {
		this.thunk = thunk;
		if (options.initialFetch !== false) {
			void this.refresh();
		}
	}

	async refresh(): Promise<void> {
		const myToken = ++this.token;
		this.loading = true;
		try {
			const result = await this.thunk();
			if (myToken !== this.token) return;
			if (result.status === "ok") {
				this.data = result.data;
				this.error = null;
			} else {
				this.error = result.error;
			}
			this.lastFetchedAt = Date.now();
		} catch (e) {
			if (myToken !== this.token) return;
			this.error = toCommandError(e) as unknown as E;
			this.lastFetchedAt = Date.now();
		} finally {
			if (myToken === this.token) this.loading = false;
		}
	}

	reset(): void {
		this.token++;
		this.data = null;
		this.error = null;
		this.loading = false;
		this.lastFetchedAt = null;
	}
}
