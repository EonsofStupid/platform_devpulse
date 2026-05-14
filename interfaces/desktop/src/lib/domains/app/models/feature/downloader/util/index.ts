/**
 * @file Downloader util barrel — types + pure helpers.
 * @module @devpulse/domains/app/models/feature/downloader/util
 */

export type {
	BundleFileEntry,
	DownloaderBundle,
	DownloaderPhase,
	DownloaderSelection,
	DownloaderTarget,
	SuggestedSlotTag,
	TagConfidence,
} from "./downloader.types.js";
export { suggestSlots, topSuggestion } from "./slot-tagging.js";
