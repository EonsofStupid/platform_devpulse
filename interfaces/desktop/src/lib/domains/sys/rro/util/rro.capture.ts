/**
 * @file rro.capture.ts
 *
 * Per-capability snapshot for the RRO devtool's Copy / Export buttons.
 * Returns a CapturePayload (filename + mime + JSON content) for the
 * active tab, or `undefined` when there's nothing meaningful to capture.
 *
 * The shell-level Copy / Export pattern is locked in
 * [project_devtool_standard.md] and the `CapturePayload` shape lives in
 * `$lib/domains/platform/_shared/types.ts`. RroDevtool runs on its own
 * custom shell (capability-driven 6-tab structure), so it wires Copy /
 * Export here at the domain level rather than via ServiceDevtoolShell.
 */

import type { CapturePayload } from "$lib/domains/platform/_shared/index.js";
import { rroState } from "../data-access/rro.state.svelte.js";
import type { RroTabId } from "./rro.types.js";

/** Pretty-print JSON with stable indentation for diff-friendly captures. */
function asJson(value: unknown): string {
	return JSON.stringify(value, null, 2);
}

/** ISO-8601 timestamp with file-safe punctuation (no `:` or `.`). */
function fileSafeTimestamp(): string {
	return new Date().toISOString().replace(/[:.]/g, "-");
}

/**
 * Snapshot the RRO state for the active capability tab. Returning
 * `undefined` hides Copy / Export for that tab — the user sees buttons
 * only when there's a real payload to capture (e.g. Search shows them
 * after a query has run; Brain shows them after Brain health loads).
 *
 * The reads inside this function track Svelte 5 runes — calling it from
 * a `$derived` in `RroDevtool` makes the capture re-evaluate whenever
 * the underlying state mutates.
 */
export function captureForTab(tabId: RroTabId): CapturePayload | undefined {
	const ts = fileSafeTimestamp();

	switch (tabId) {
		case "state": {
			if (!rroState.rroSnapshot) return undefined;
			return {
				filename: `rro-state-${ts}.json`,
				mime: "application/json",
				content: asJson({ snapshot: rroState.rroSnapshot }),
			};
		}
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
		case "tuning": {
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
		case "collections": {
			if (!rroState.health) return undefined;
			return {
				filename: `rro-collections-${ts}.json`,
				mime: "application/json",
				content: asJson({ health: rroState.health }),
			};
		}
		case "brain": {
			if (!rroState.brainHealth) return undefined;
			return {
				filename: `rro-brain-${ts}.json`,
				mime: "application/json",
				content: asJson({
					health: rroState.brainHealth,
					stats: rroState.brainStats,
				}),
			};
		}
		case "encoder": {
			if (!rroState.encoder) return undefined;
			return {
				filename: `rro-encoder-${ts}.json`,
				mime: "application/json",
				content: asJson({ slot: rroState.encoder }),
			};
		}
	}
	return undefined;
}
