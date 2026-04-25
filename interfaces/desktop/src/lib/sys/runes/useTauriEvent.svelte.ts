/**
 * @file sys/runes/useTauriEvent.svelte.ts
 * @module @devpulse/sys/runes/useTauriEvent
 * @description Reactive subscription to a Tauri event. Replaces the
 * per-devtool `onMount(async () => { unlisten = await listen(...) })`
 * + matching `onDestroy(unlisten)` boilerplate.
 *
 * Auto-cleanup runs via `$effect`, so this MUST be instantiated during a
 * component's synchronous setup (`<script>` body or another effect). For
 * non-component usage, call `destroy()` manually after construction.
 */

import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface TauriEventOptions {
	/** History ring-buffer size — keeps the last N payloads. Default 32. */
	capacity?: number;
}

export class TauriEventStream<T> {
	value = $state<T | null>(null);
	history = $state<T[]>([]);
	subscribed = $state<boolean>(false);

	private readonly capacity: number;
	private unlisten: UnlistenFn | null = null;
	private alive = true;

	constructor(eventName: string, options: TauriEventOptions = {}) {
		this.capacity = options.capacity ?? 32;

		$effect(() => {
			void listen<T>(eventName, (event) => {
				if (!this.alive) return;
				this.value = event.payload;
				const next =
					this.history.length >= this.capacity
						? this.history.slice(this.history.length - this.capacity + 1)
						: this.history.slice();
				next.push(event.payload);
				this.history = next;
			}).then((fn) => {
				if (!this.alive) {
					fn();
					return;
				}
				this.unlisten = fn;
				this.subscribed = true;
			});

			return () => this.destroy();
		});
	}

	/** Manual cleanup — only needed when instantiated outside a component. */
	destroy(): void {
		this.alive = false;
		this.subscribed = false;
		if (this.unlisten) {
			this.unlisten();
			this.unlisten = null;
		}
	}

	clearHistory(): void {
		this.history = [];
	}
}
