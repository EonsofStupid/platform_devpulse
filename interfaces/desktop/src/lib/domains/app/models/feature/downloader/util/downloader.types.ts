/**
 * @file Downloader type vocabulary — types only, no behavior.
 * @module @devpulse/domains/app/models/feature/downloader/util/downloader-types
 *
 * The downloader overlay walks five phases:
 *   1. `closed`      — overlay not mounted (default state).
 *   2. `search`      — user typing a query, results streaming in from HF.
 *   3. `confirm`     — bundle preview + slot tag + second acknowledgement.
 *   4. `downloading` — aggregate progress + cancel.
 *   5. `complete`    — registry entry landed, slot loaded.
 *
 * Failure surfaces as `error` and the state machine returns to `search`
 * on dismiss so the user can pick a different repo without reopening.
 */

import type { HfSearchResultInfo, RepoFile } from "#lib/sys/generated/bindings.js";

/** Lifecycle phases of the overlay state machine. */
export type DownloaderPhase =
	| "closed"
	| "search"
	| "confirm"
	| "downloading"
	| "complete"
	| "error";

/**
 * Context passed to `modelDownloaderState.open()`. Every field optional
 * so any consumer can open the overlay without pre-resolving a slot or
 * project — search-first flow.
 */
export interface DownloaderTarget {
	/** When set, the slot id auto-populates on confirm and search results
	 * can be filtered against the slot's required capability. */
	slotId?: string;
	/** When set, downloads land under `<models_dir>/_per_project/<id>/`
	 * instead of the global pool. Discovery scans both trees so loaded
	 * slots resolve either way. */
	projectId?: string;
	/** Pre-fills the search input — useful for "browse models like X". */
	defaultQuery?: string;
}

/**
 * The user's choice from the search results — a repo plus the role this
 * download is intended to fill. Carried into the confirm phase so the
 * second-acknowledgement CTA knows where the bundle will land.
 */
export interface DownloaderSelection {
	/** HF repo identifier — `<owner>/<name>`. */
	repoId: string;
	/** Primary file within the bundle — drives `plan_bundle` on the kernel
	 * side. The kernel resolves companions (tokenizer, configs, shards)
	 * automatically; the UI only chooses the primary. */
	primaryFilename: string;
	/** Slot id the bundle will assign to once download completes. May be
	 * an empty string when the user is downloading-without-assignment
	 * (advanced flow — kernel records the registry entry but skips the
	 * install_to_slot step). */
	slotId: string;
	/** Full HF result the user clicked — kept for display + license / size
	 * context in the confirm panel. */
	hit: HfSearchResultInfo;
}

/**
 * Snapshot of the bundle the kernel will fetch. Populated after the user
 * selects a result — `list_repo_files` resolves to this list which the
 * confirm panel renders one row per file.
 */
export interface DownloaderBundle {
	/** Total expected size when every sibling reports it; `null` when one
	 * or more files don't expose a size on the Hub. */
	totalBytes: number | null;
	/** Files in the bundle, in the order `list_repo_files` returns them. */
	files: RepoFile[];
}

/**
 * Per-file row in the bundle preview. Carries verified-on-disk state so
 * the confirm panel can show "5 of 7 already downloaded — only fetching
 * 2." Populated client-side by checking the local registry against the
 * bundle list before the user confirms.
 */
export interface BundleFileEntry {
	/** File name relative to the repo root. */
	name: string;
	/** Size in bytes when the Hub exposes it; `null` for tiny configs the
	 * Hub omits the size for. */
	sizeBytes: number | null;
	/** True when the file already exists on disk + LFS verification passed
	 * (or the file is too small for LFS). Skipped on download. */
	alreadyPresent: boolean;
}

/** Heuristic confidence — see `slot-tagging.ts`. */
export type TagConfidence = "exact" | "high" | "medium" | "low";

/**
 * A slot id the downloader thinks is a plausible target for the result,
 * with confidence based on filename + metadata heuristics. Used by the
 * search panel's per-result dropdown.
 */
export interface SuggestedSlotTag {
	slotId: string;
	confidence: TagConfidence;
	/** One-line reason — surfaced as tooltip / aria-description. */
	reason: string;
}
