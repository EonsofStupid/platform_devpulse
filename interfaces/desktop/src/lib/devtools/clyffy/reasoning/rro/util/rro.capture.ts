/**
 * @file rro.capture.ts
 *
 * Per-tab snapshot provider for the RRO devtool's Copy / Export buttons.
 * Returns a `CapturePayload` (filename + mime + JSON content) for the
 * tab the user is currently on, or `undefined` when there's nothing
 * meaningful to capture (so the shell hides the buttons).
 *
 * The shell-level Copy / Export pattern is locked in
 * [project_devtool_standard.md]; the `CapturePayload` shape lives in
 * `#lib/devtools/_shared/types.ts`. RroDevtool now uses
 * `ServiceDevtoolShell`, so this function receives the shell's tab id —
 * one of the standard `status / config / logs / actions / debug` ids
 * OR an `extraTabs` id (`search`, `collections`).
 */

import type { CapturePayload } from "#lib/devtools/index.js";
import { rroState } from "#lib/sys/data-access/rro/rro.state.svelte.js";

/** Pretty-print JSON with stable indentation for diff-friendly captures. */
function asJson(value: unknown): string {
	return JSON.stringify(value, null, 2);
}

/** ISO-8601 timestamp with file-safe punctuation (no `:` or `.`). */
function fileSafeTimestamp(): string {
	return new Date().toISOString().replace(/[:.]/g, "-");
}

/**
 * Snapshot the RRO state for the shell's active tab. Returning
 * `undefined` hides Copy / Export for that tab — the user sees buttons
 * only when there's a real payload to capture (e.g. Search Try-It shows
 * them after a query has run).
 *
 * The reads inside this function track Svelte 5 runes — calling it from
 * a `$derived` in `RroDevtool` makes the capture re-evaluate whenever
 * the underlying state mutates.
 */
export function captureForTab(tabId: string): CapturePayload | undefined {
	const ts = fileSafeTimestamp();

	switch (tabId) {
		// ── Standard shell tabs ─────────────────────────────────
		case "status": {
			if (!rroState.rroSnapshot) return undefined;
			return {
				filename: `rro-state-${ts}.json`,
				mime: "application/json",
				content: asJson({ snapshot: rroState.rroSnapshot }),
			};
		}
		case "config": {
			if (!rroState.config) return undefined;
			return {
				filename: `rro-tuning-${ts}.json`,
				mime: "application/json",
				content: asJson({
					config: rroState.config,
					param_meta: rroState.paramMeta,
				}),
			};
		}
		case "actions": {
			if (!rroState.encoder) return undefined;
			return {
				filename: `rro-encoder-${ts}.json`,
				mime: "application/json",
				content: asJson({ slot: rroState.encoder }),
			};
		}
		case "debug": {
			if (!rroState.rroSnapshot && !rroState.config) return undefined;
			return {
				filename: `rro-debug-${ts}.json`,
				mime: "application/json",
				content: asJson({
					snapshot: rroState.rroSnapshot,
					config: rroState.config,
					param_meta: rroState.paramMeta,
					encoder: rroState.encoder,
				}),
			};
		}
		// ── Extra tabs ──────────────────────────────────────────
		case "search": {
			if (rroState.searchResults.length === 0 && !rroState.searchQuery) {
				return undefined;
			}
			return {
				filename: `rro-search-${ts}.json`,
				mime: "application/json",
				content: asJson({
					query: rroState.searchQuery,
					collection: rroState.searchCollection,
					results: rroState.searchResults,
					embed_latency_ms: rroState.embedLatencyMs,
					search_latency_ms: rroState.searchLatencyMs,
				}),
			};
		}
		case "collections": {
			if (!rroState.health) return undefined;
			return {
				filename: `rro-collections-${ts}.json`,
				mime: "application/json",
				content: asJson({ health: rroState.health }),
			};
		}
		// Logs has its own ScopedLogPanel — no capture binding here.
		default:
			return undefined;
	}
}
