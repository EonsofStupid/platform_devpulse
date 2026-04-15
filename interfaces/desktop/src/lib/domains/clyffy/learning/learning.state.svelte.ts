/**
 * @file Learning state — rotating content picker with session dedupe.
 * @module @devpulse/domains/clyffy/learning
 *
 * Factory-authored rune state that exposes one current loading
 * content entry (DYK / KDROPS / T&T) and rotates through the catalog
 * without repeating anything the user already saw this session.
 *
 * # Usage
 *
 * ```svelte
 * <script>
 *   import { loadingContent } from '$lib/domains/clyffy/learning/learning.state.svelte.js';
 *   import { onMount, onDestroy } from 'svelte';
 *
 *   onMount(() => loadingContent.start({ rotateEveryMs: 8000 }));
 *   onDestroy(() => loadingContent.stop());
 * </script>
 *
 * <p>{loadingContent.current?.content}</p>
 * ```
 *
 * The factory pattern matches `clyffy.state.svelte.ts` — readonly
 * getters prevent stray writes from consumer code, and `start()`
 * / `stop()` own the rotation timer lifecycle.
 */

import { logInfo } from "$lib/sys/logger.js";
import {
	allEntries,
	entriesByKind,
	entriesByTag,
	type LoadingContentEntry,
	type LoadingContentKind,
} from "./loading-content.js";

export interface LoadingContentRotator {
	/** Current entry, or `null` before `start()` or after `stop()`. */
	readonly current: LoadingContentEntry | null;
	/** Number of entries shown this session (for pagination / UX). */
	readonly seenCount: number;
	/** Pick the next entry explicitly — useful for a "next" button. */
	next(): void;
	/**
	 * Start the auto-rotation timer.
	 *
	 * @param opts.rotateEveryMs  milliseconds between rotations (default 8000)
	 * @param opts.kind          bias toward a specific kind (optional)
	 * @param opts.tag           bias toward entries matching a tag (optional)
	 */
	start(opts?: { rotateEveryMs?: number; kind?: LoadingContentKind; tag?: string }): () => void;
	/** Stop rotation + clear the current entry. */
	stop(): void;
}

export function createLoadingContent(): LoadingContentRotator {
	let current = $state<LoadingContentEntry | null>(null);
	let seen = $state<Set<string>>(new Set());
	let timer: ReturnType<typeof setInterval> | null = null;
	let pool: LoadingContentEntry[] = [];

	function pickPool(kind?: LoadingContentKind, tag?: string): LoadingContentEntry[] {
		if (tag) return entriesByTag(tag);
		if (kind) return entriesByKind(kind);
		return [...allEntries()];
	}

	function pickNext(): LoadingContentEntry | null {
		if (pool.length === 0) return null;

		// Unseen first. Once the pool is exhausted, reset and start over
		// — this produces a full cycle per session before repeats.
		let candidates = pool.filter((e) => !seen.has(e.id));
		if (candidates.length === 0) {
			// Reset — user saw the full pool.
			seen = new Set();
			candidates = pool;
		}

		// Avoid immediate self-repeat.
		if (current && candidates.length > 1) {
			candidates = candidates.filter((e) => e.id !== current?.id);
		}

		const pick = candidates[Math.floor(Math.random() * candidates.length)];
		if (!pick) return null;

		const nextSeen = new Set(seen);
		nextSeen.add(pick.id);
		seen = nextSeen;
		return pick;
	}

	return {
		get current() {
			return current;
		},
		get seenCount() {
			return seen.size;
		},
		next() {
			const pick = pickNext();
			if (pick) current = pick;
		},
		start(opts = {}) {
			const { rotateEveryMs = 8000, kind, tag } = opts;
			pool = pickPool(kind, tag);

			if (pool.length === 0) {
				logInfo("clyffy.learning", "No loading content matched filter — rotation idle");
				return () => {};
			}

			// Immediate first pick
			current = pickNext();

			// Rotation timer
			timer = setInterval(
				() => {
					const pick = pickNext();
					if (pick) current = pick;
				},
				Math.max(2000, rotateEveryMs),
			);

			logInfo(
				"clyffy.learning",
				`Loading content rotator started (pool=${pool.length}, rotate=${rotateEveryMs}ms)`,
			);

			return () => {
				this.stop();
			};
		},
		stop() {
			if (timer) {
				clearInterval(timer);
				timer = null;
			}
			current = null;
			pool = [];
			logInfo("clyffy.learning", "Loading content rotator stopped");
		},
	};
}

/** App-wide singleton — one rotator shared across every loading surface. */
export const loadingContent = createLoadingContent();
