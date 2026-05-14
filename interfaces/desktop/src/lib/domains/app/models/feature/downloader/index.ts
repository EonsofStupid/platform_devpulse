/**
 * @file Model Downloader public barrel.
 * @module @devpulse/domains/app/models/feature/downloader
 *
 * Public surface of the standalone Model Downloader overlay. Consumers
 * mount `ModelDownloaderOverlay` once at the app root and call
 * `modelDownloaderState.open({ slotId?, projectId?, defaultQuery? })`
 * from anywhere to surface the dialog.
 *
 * Re-exported up one more level via
 * `$lib/domains/app/models/index.ts` so importers reach for
 * `@/domains/app/models` not this deep path.
 */

export { modelDownloaderState } from "./data-access/index.js";
export { default as ModelDownloaderOverlay } from "./ModelDownloaderOverlay.svelte";
export type {
	BundleFileEntry,
	DownloaderBundle,
	DownloaderPhase,
	DownloaderSelection,
	DownloaderTarget,
	SuggestedSlotTag,
	TagConfidence,
} from "./util/index.js";
export { suggestSlots, topSuggestion } from "./util/index.js";
