/**
 * @file Clyffy Status — factory-authored rune state + lifecycle.
 * @module @devpulse/domains/clyffy/status
 *
 * Clyffy-as-a-being, layman-safe state. Answers "what is Clyffy
 * doing right now?" in terms the end user understands — no prompt
 * content, no algorithm names.
 *
 * Architecture:
 * - Factory `createClyffyStatus()` owns reactive state AND lifecycle.
 * - Readers consume through readonly getters; only `start()` can
 *   mutate mood. Prevents stray writes from component code.
 * - Subscription lifetime is scoped by `$effect.root` so HMR + test
 *   teardown work automatically.
 * - All Tauri event handling flows through `sys/streams/tauri-event`
 *   per the streams boundary rule.
 *
 * Usage (root layout):
 * ```svelte
 * <script>
 *   import { clyffyStatus } from '$lib/domains/clyffy/status/clyffy.state.svelte.js';
 *   import { onDestroy } from 'svelte';
 *   const stop = clyffyStatus.start();
 *   onDestroy(stop);
 * </script>
 * ```
 *
 * Usage (readers):
 * ```svelte
 * <script>
 *   import { clyffyStatus } from '$lib/domains/clyffy/status/clyffy.state.svelte.js';
 * </script>
 * <p>{clyffyStatus.mood}</p>
 * ```
 */

import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";
import { inferenceEvents, modelEvents } from "$lib/sys/streams/tauri-event.svelte.js";

/** Clyffy's current disposition, layman-safe. */
export type ClyffyMood =
	| "idle"
	| "listening"
	| "thinking"
	| "working"
	| "alert"
	| "resting"
	| "unknown";

export interface ClyffyActivity {
	text: string;
	slotId: string | null;
	startedAt: number;
}

export interface ClyffyStatus {
	/** Current mood. Readonly from the outside. */
	readonly mood: ClyffyMood;
	/** Current activity description + context. Readonly. */
	readonly activity: ClyffyActivity;
	/** Timestamp of the last narration or event Clyffy emitted. */
	readonly lastSpokeAt: number;
	/** Whether the platform is booted + healthy. */
	readonly reachable: boolean;
	/** Start all subscriptions + health polling. Returns cleanup fn. */
	start(): () => void;
}

const HEALTH_POLL_MS = 5000;

export function createClyffyStatus(): ClyffyStatus {
	let mood = $state<ClyffyMood>("unknown");
	let activity = $state<ClyffyActivity>({ text: "", slotId: null, startedAt: 0 });
	let lastSpokeAt = $state<number>(0);
	let reachable = $state<boolean>(false);

	function setMood(next: ClyffyMood, text = "", slotId: string | null = null): void {
		mood = next;
		activity = { text, slotId, startedAt: Date.now() };
	}

	function markSpoke(): void {
		lastSpokeAt = Date.now();
	}

	function setReachable(value: boolean): void {
		reachable = value;
		if (!value && mood !== "unknown") {
			setMood("resting", "");
		}
	}

	async function pollHealth(): Promise<void> {
		const result = await commands.getStatus();
		if (result.status === "ok") {
			const healthy = result.data.status === "Healthy" || result.data.status === "Degraded";
			setReachable(healthy);
			if (healthy && mood === "unknown") {
				setMood("idle", "");
			}
		} else {
			setReachable(false);
		}
	}

	function start(): () => void {
		let disposed = false;
		let healthTimer: ReturnType<typeof setInterval> | null = null;

		const stopRoot = $effect.root(() => {
			$effect(() => {
				return modelEvents.loadingStarted.handle((payload) => {
					setMood("working", "Loading a model", payload.slot_id);
				});
			});

			$effect(() => {
				return modelEvents.loadingComplete.handle((payload) => {
					setMood("idle", "", null);
					markSpoke();
					logInfo("clyffy.status", `slot ready: ${payload.slot_id}`);
				});
			});

			$effect(() => {
				return modelEvents.loadingFailed.handle((payload) => {
					setMood("alert", "Something needs attention", payload.slot_id);
				});
			});

			$effect(() => {
				return modelEvents.swapStarted.handle((payload) => {
					setMood("working", "Switching models", payload.slot_id);
				});
			});

			$effect(() => {
				return modelEvents.swapComplete.handle(() => {
					setMood("idle", "", null);
				});
			});

			$effect(() => {
				return modelEvents.downloadStarted.handle(() => {
					setMood("working", "Downloading a model", null);
				});
			});

			$effect(() => {
				return modelEvents.downloadComplete.handle(() => {
					setMood("idle", "", null);
					markSpoke();
				});
			});

			$effect(() => {
				return modelEvents.downloadFailed.handle(() => {
					setMood("alert", "A download needs attention", null);
				});
			});

			$effect(() => {
				return inferenceEvents.started.handle((payload) => {
					setMood("thinking", "Working on your request", payload.slot_id);
				});
			});

			$effect(() => {
				return inferenceEvents.complete.handle(() => {
					setMood("idle", "", null);
					markSpoke();
				});
			});
		});

		// Kick off initial poll + interval loop. Gate the first poll on
		// platform readiness — `get_status` returns "Platform is still
		// booting" until boot completes. The interval below is left as-is;
		// a tick during boot degrades gracefully (setReachable(false)).
		void (async () => {
			try {
				await platformState.whenReady();
				await pollHealth();
			} catch (e) {
				logError(
					"clyffy.status",
					`initial health poll failed: ${e instanceof Error ? e.message : String(e)}`,
				);
			}
		})();
		healthTimer = setInterval(() => {
			void pollHealth().catch((e) => {
				logError(
					"clyffy.status",
					`health poll failed: ${e instanceof Error ? e.message : String(e)}`,
				);
			});
		}, HEALTH_POLL_MS);

		logInfo("clyffy.status", "started");

		return () => {
			if (disposed) return;
			disposed = true;
			if (healthTimer) {
				clearInterval(healthTimer);
				healthTimer = null;
			}
			stopRoot();
			mood = "unknown";
			activity = { text: "", slotId: null, startedAt: 0 };
			lastSpokeAt = 0;
			reachable = false;
			logInfo("clyffy.status", "stopped");
		};
	}

	return {
		get mood() {
			return mood;
		},
		get activity() {
			return activity;
		},
		get lastSpokeAt() {
			return lastSpokeAt;
		},
		get reachable() {
			return reachable;
		},
		start,
	};
}

/** App-wide singleton. Start once from the root layout. */
export const clyffyStatus = createClyffyStatus();
