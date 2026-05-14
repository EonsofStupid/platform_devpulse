/**
 * @file modelDownloaderState — singleton rune for the reusable Model Downloader overlay.
 * @module @devpulse/domains/app/models/feature/downloader/data-access/downloader-state
 *
 * Single instance per app session. Any surface that wants to open the
 * downloader calls `modelDownloaderState.open({ slotId?, projectId?,
 * defaultQuery? })`; the overlay component listens to `phase` and
 * renders the appropriate panel.
 *
 * ## State machine
 *
 *   closed ─open()──▶ search ─select()──▶ confirm ─confirm()──▶ downloading
 *      ▲                ▲                    │                       │
 *      │                │                    │                       │
 *      └─close()────────┴────────back()──────┘                       │
 *                                                                    │
 *                                            ┌──── error ◀───────────┤
 *                                            │                       │
 *                                            └─retry()──▶ confirm ◀──┤
 *                                                                    │
 *                                                                    ▼
 *                                                                complete
 *                                                                    │
 *                                                              close()─▶ closed
 *
 * Backed by these Tauri commands:
 *   - `searchHuggingface(query, limit)` → results list for the search panel
 *   - `listRepoFiles(repoId)` → bundle preview for the confirm panel
 *   - `installToSlot(repoId, file, slotId, scope?)` → assigned install chain
 *   - `downloadModel(repoId, file, scope?)` → no-slot download (advanced)
 *   - `cancelDownload(downloadId)` → mid-flight abort
 *   - `setHfToken / hasHfToken / clearHfToken / hfTokenSuffix` → token strip
 *
 * Progress feeds in from `installState` (for the assigned path) and
 * `downloadState` (for the no-slot path) — both already live runes
 * boot-wired in `bootstrapDownloadBridge`. The overlay components read
 * from those runes directly; the state machine here owns lifecycle
 * + selection + dispatch, not byte-counting.
 */

import { downloadState } from "$lib/sys/activity-hud/download.state.svelte.js";
import { installState } from "$lib/sys/activity-hud/install.state.svelte.js";
import {
	cancelDownload,
	clearHfToken,
	downloadModel,
	hasHfToken,
	hfTokenSuffix,
	installToSlot,
	listRepoFiles,
	searchHuggingface,
	setHfToken,
} from "$lib/sys/bindings/models/index.js";
import type { DownloadScope, HfSearchResultInfo, RepoFile } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";
import type {
	DownloaderBundle,
	DownloaderPhase,
	DownloaderSelection,
	DownloaderTarget,
} from "../util/downloader.types.js";

/** Debounce window for the HF search input — trailing-edge. */
const SEARCH_DEBOUNCE_MS = 250;
/** Minimum query length before we hit the HF API. */
const SEARCH_MIN_LENGTH = 2;
/** Max results per search — matches the existing HfSearchDialog default. */
const SEARCH_LIMIT = 25;

/** Snapshot of HF-token state surfaced to the token strip. */
interface TokenStatus {
	stored: boolean;
	/** Last N chars of the token, when one is stored. `null` when not. */
	suffix: string | null;
}

class ModelDownloaderState {
	// ── Lifecycle ──────────────────────────────────────────────────
	phase = $state<DownloaderPhase>("closed");
	target = $state<DownloaderTarget | null>(null);
	/** Element that triggered `open()` — focus returns here on close so
	 * the ARIA APG dialog pattern's focus-restoration is preserved. */
	openerElement: HTMLElement | null = null;

	// ── Search phase ────────────────────────────────────────────────
	query = $state("");
	results = $state<HfSearchResultInfo[]>([]);
	searching = $state(false);
	searchError = $state<string | null>(null);
	private searchDebounce: ReturnType<typeof setTimeout> | null = null;

	// ── Confirm phase ───────────────────────────────────────────────
	selection = $state<DownloaderSelection | null>(null);
	bundle = $state<DownloaderBundle | null>(null);
	bundleLoading = $state(false);

	// ── Downloading phase ───────────────────────────────────────────
	/** Install identifier when the assigned-slot path is in flight.
	 * Surfaces progress via `installState.byId(activeInstallId)`. */
	activeInstallId = $state<string | null>(null);
	/** Download identifier when the no-slot path is in flight.
	 * Surfaces progress via `downloadState.byId(activeDownloadId)`. */
	activeDownloadId = $state<string | null>(null);

	// ── Error phase ─────────────────────────────────────────────────
	errorDetail = $state<string | null>(null);

	// ── Token status (read-through from kernel keyring) ─────────────
	tokenStatus = $state<TokenStatus>({ stored: false, suffix: null });

	// ── Acknowledgement gate — confirm-during-download dismiss ──────
	closeConfirmationPending = $state(false);

	// ─────────────────────────────────────────────────────────────────
	// Lifecycle verbs
	// ─────────────────────────────────────────────────────────────────

	/**
	 * Open the downloader with the given context. Idempotent — opening
	 * over an already-open overlay just rebinds the target.
	 *
	 * If `target.defaultQuery` is set + meets the minimum length, the
	 * search fires immediately so the user lands on a populated list.
	 *
	 * `opener` is captured for focus restoration when the overlay
	 * closes (APG dialog focus contract).
	 */
	open(target: DownloaderTarget = {}, opener: HTMLElement | null = null): void {
		this.target = target;
		this.openerElement = opener;
		this.query = target.defaultQuery ?? "";
		this.results = [];
		this.searching = false;
		this.searchError = null;
		this.selection = null;
		this.bundle = null;
		this.bundleLoading = false;
		this.errorDetail = null;
		this.activeInstallId = null;
		this.activeDownloadId = null;
		this.closeConfirmationPending = false;
		this.phase = "search";
		void this.refreshTokenStatus();
		if (this.query.trim().length >= SEARCH_MIN_LENGTH) {
			void this.search(this.query);
		}
	}

	/**
	 * Request close. When a download is in flight, raises a confirmation
	 * flag instead of closing immediately — the overlay surface renders
	 * the "stop the download?" dialog and either calls `forceClose()`
	 * (yes) or `dismissCloseConfirmation()` (no, keep going).
	 */
	close(): void {
		if (this.phase === "downloading") {
			this.closeConfirmationPending = true;
			return;
		}
		this.finalize();
	}

	/** Confirmed close even when a download is in flight — cancels first. */
	forceClose(): void {
		if (this.activeDownloadId) {
			void cancelDownload(this.activeDownloadId);
		}
		// `installToSlot` has no separate cancel command — the chain's
		// download leg is cancelled by its underlying `cancel_download`
		// once the kernel exposes the install→download id mapping. For
		// now, abandoning the UI surface leaves the kernel chain to
		// terminate naturally; the install event log records the abort.
		this.finalize();
	}

	dismissCloseConfirmation(): void {
		this.closeConfirmationPending = false;
	}

	/** Closes immediately. Used by complete-phase "Done" + forceClose. */
	private finalize(): void {
		const opener = this.openerElement;
		this.phase = "closed";
		this.target = null;
		this.openerElement = null;
		this.activeInstallId = null;
		this.activeDownloadId = null;
		this.closeConfirmationPending = false;
		queueMicrotask(() => opener?.focus());
	}

	// ─────────────────────────────────────────────────────────────────
	// Search phase
	// ─────────────────────────────────────────────────────────────────

	setQuery(next: string): void {
		this.query = next;
		if (this.searchDebounce) clearTimeout(this.searchDebounce);
		this.searchDebounce = setTimeout(() => void this.search(this.query), SEARCH_DEBOUNCE_MS);
	}

	async search(q: string): Promise<void> {
		const trimmed = q.trim();
		if (trimmed.length < SEARCH_MIN_LENGTH) {
			this.results = [];
			this.searching = false;
			this.searchError = null;
			return;
		}
		this.searching = true;
		this.searchError = null;
		try {
			const r = await searchHuggingface(trimmed, SEARCH_LIMIT);
			if (r.status === "ok") {
				this.results = r.data;
				logInfo("downloader", `search ok query=${trimmed} hits=${r.data.length}`);
			} else {
				this.results = [];
				this.searchError = String(r.error);
				logError("downloader", `search failed: ${r.error}`);
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.results = [];
			this.searchError = msg;
			logError("downloader", `search threw: ${msg}`);
		} finally {
			this.searching = false;
		}
	}

	// ─────────────────────────────────────────────────────────────────
	// Selection + bundle preview
	// ─────────────────────────────────────────────────────────────────

	/**
	 * Move from `search` to `confirm`. Resolves the bundle preview from
	 * the kernel (`listRepoFiles`) and parks it on `bundle`. On error,
	 * routes to `error` phase so the user can retry without losing
	 * their search context.
	 */
	async select(result: HfSearchResultInfo, suggestedSlotId: string): Promise<void> {
		const primary = this.pickPrimaryFromResult(result);
		const slotId = this.target?.slotId ?? suggestedSlotId;
		this.selection = {
			repoId: result.repo_id,
			primaryFilename: primary,
			slotId,
			hit: result,
		};
		this.bundle = null;
		this.bundleLoading = true;
		this.errorDetail = null;
		this.phase = "confirm";
		try {
			const r = await listRepoFiles(result.repo_id);
			if (r.status === "ok") {
				this.bundle = {
					totalBytes: this.sumSizes(r.data),
					files: r.data,
				};
				logInfo("downloader", `bundle ok repo=${result.repo_id} files=${r.data.length}`);
			} else {
				this.errorDetail = String(r.error);
				this.phase = "error";
				logError("downloader", `list_repo_files failed: ${r.error}`);
			}
		} catch (e) {
			this.errorDetail = e instanceof Error ? e.message : String(e);
			this.phase = "error";
			logError("downloader", `list_repo_files threw: ${this.errorDetail}`);
		} finally {
			this.bundleLoading = false;
		}
	}

	/**
	 * Update the slot tag after confirm — used by the slot dropdown in
	 * `DownloaderConfirmPanel`. Empty string means "don't assign to a
	 * slot, just download" (advanced).
	 */
	setSlot(slotId: string): void {
		if (this.selection) this.selection.slotId = slotId;
	}

	/** Update the primary filename — the user may pick a different
	 * quant from the bundle preview in the confirm panel. */
	setPrimary(filename: string): void {
		if (this.selection) this.selection.primaryFilename = filename;
	}

	// ─────────────────────────────────────────────────────────────────
	// Confirm → downloading transition
	// ─────────────────────────────────────────────────────────────────

	async confirm(): Promise<void> {
		if (!this.selection) return;
		const { repoId, primaryFilename, slotId } = this.selection;
		const scope = this.buildScope();
		this.phase = "downloading";
		this.errorDetail = null;
		this.activeInstallId = null;
		this.activeDownloadId = null;

		logInfo(
			"downloader",
			`confirm repo=${repoId} file=${primaryFilename} slot=${slotId || "<none>"} scope=${scope ? "project" : "global"}`,
		);

		try {
			if (slotId) {
				const r = await installToSlot(repoId, primaryFilename, slotId, scope);
				if (r.status === "ok") {
					this.activeInstallId = r.data;
				} else {
					this.errorDetail = String(r.error);
					this.phase = "error";
					logError("downloader", `install_to_slot failed: ${r.error}`);
				}
			} else {
				const r = await downloadModel(repoId, primaryFilename, scope);
				if (r.status === "ok") {
					this.activeDownloadId = r.data;
				} else {
					this.errorDetail = String(r.error);
					this.phase = "error";
					logError("downloader", `download_model failed: ${r.error}`);
				}
			}
		} catch (e) {
			this.errorDetail = e instanceof Error ? e.message : String(e);
			this.phase = "error";
			logError("downloader", `confirm threw: ${this.errorDetail}`);
		}
	}

	/** Cancel an in-flight download and return to the search panel. */
	async cancel(): Promise<void> {
		if (this.activeDownloadId) {
			await cancelDownload(this.activeDownloadId);
		}
		this.activeDownloadId = null;
		this.activeInstallId = null;
		this.phase = "search";
	}

	/**
	 * Called by the overlay shell when an in-flight install / download
	 * reports completion (via the activity-hud runes). Promotes the
	 * phase to `complete` so the user sees the success view.
	 */
	markComplete(): void {
		if (this.phase !== "downloading") return;
		this.phase = "complete";
		logInfo("downloader", "phase: complete");
	}

	/** Called when the install / download event sink reports a failure. */
	markFailed(error: string): void {
		this.errorDetail = error;
		this.phase = "error";
		logError("downloader", `phase: error — ${error}`);
	}

	// ─────────────────────────────────────────────────────────────────
	// Back / retry navigation
	// ─────────────────────────────────────────────────────────────────

	back(): void {
		if (this.phase === "confirm") {
			this.phase = "search";
			this.selection = null;
			this.bundle = null;
		} else if (this.phase === "error") {
			this.phase = "search";
			this.errorDetail = null;
		}
	}

	retry(): void {
		if (this.phase !== "error") return;
		if (this.selection) {
			this.errorDetail = null;
			this.phase = "confirm";
		} else {
			this.back();
		}
	}

	// ─────────────────────────────────────────────────────────────────
	// HF token strip
	// ─────────────────────────────────────────────────────────────────

	async refreshTokenStatus(): Promise<void> {
		try {
			const hasR = await hasHfToken();
			const stored = hasR.status === "ok" && hasR.data;
			if (stored) {
				const suffixR = await hfTokenSuffix(4);
				this.tokenStatus = {
					stored: true,
					suffix: suffixR.status === "ok" ? suffixR.data : null,
				};
			} else {
				this.tokenStatus = { stored: false, suffix: null };
			}
		} catch (e) {
			logError(
				"downloader",
				`token status refresh failed: ${e instanceof Error ? e.message : String(e)}`,
			);
		}
	}

	async saveToken(token: string): Promise<void> {
		const trimmed = token.trim();
		if (trimmed.length === 0) return;
		const r = await setHfToken(trimmed);
		if (r.status === "ok") {
			await this.refreshTokenStatus();
			logInfo("downloader", "token saved");
		} else {
			logError("downloader", `set_hf_token failed: ${r.error}`);
		}
	}

	async clearToken(): Promise<void> {
		const r = await clearHfToken();
		if (r.status === "ok") {
			await this.refreshTokenStatus();
			logInfo("downloader", "token cleared");
		} else {
			logError("downloader", `clear_hf_token failed: ${r.error}`);
		}
	}

	// ─────────────────────────────────────────────────────────────────
	// Internals
	// ─────────────────────────────────────────────────────────────────

	/**
	 * Pick the primary filename to download from an HF result.
	 *
	 * Strategy:
	 *   1. If `gguf_files` is non-empty, pick the smallest — typically
	 *      the lowest quant the user can run, which is the safest
	 *      first-pull. Power users can override in the confirm panel.
	 *   2. Otherwise fall back to `model.safetensors` (single-file
	 *      Candle path). `plan_bundle` on the kernel side handles
	 *      sharded safetensors automatically once `list_repo_files`
	 *      reveals the shard pattern, so the primary filename only
	 *      needs to be a *valid* sibling, not the full bundle.
	 */
	private pickPrimaryFromResult(result: HfSearchResultInfo): string {
		const gguf = result.gguf_files ?? [];
		if (gguf.length > 0) {
			const sorted = [...gguf].sort((a, b) => a.size_bytes - b.size_bytes);
			return sorted[0].filename;
		}
		return "model.safetensors";
	}

	/** Sum bundle sizes, returning `null` if any size is unknown — the
	 * confirm panel renders `null` as the "—" placeholder. */
	private sumSizes(files: RepoFile[]): number | null {
		let total = 0;
		for (const f of files) {
			if (f.size === null) return null;
			total += f.size;
		}
		return total;
	}

	/**
	 * Build the `DownloadScope` envelope that the Tauri commands accept.
	 * Returns `null` for global scope — the kernel's `unwrap_or_default()`
	 * maps that to `DownloadScope::Global`. Returns a Project envelope
	 * when the target carries a project id.
	 */
	private buildScope(): DownloadScope | null {
		const projectId = this.target?.projectId?.trim();
		if (projectId && projectId.length > 0) {
			return { kind: "project", id: projectId };
		}
		return null;
	}

	// ─────────────────────────────────────────────────────────────────
	// Activity-hud bridging (consumed via $derived on the overlay shell)
	// ─────────────────────────────────────────────────────────────────

	/** Snapshot of the in-flight install state, when one is active. */
	currentInstall = $derived(
		this.activeInstallId
			? (installState.list.find((i) => i.installId === this.activeInstallId) ?? null)
			: null,
	);

	/** Snapshot of the in-flight no-slot download state, when active. */
	currentDownload = $derived(
		this.activeDownloadId
			? (downloadState.list.find((d) => d.downloadId === this.activeDownloadId) ?? null)
			: null,
	);
}

export const modelDownloaderState = new ModelDownloaderState();
