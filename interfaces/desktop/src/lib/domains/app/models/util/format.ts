/**
 * @file Layman-friendly formatters for model loader UI.
 * @module @devpulse/domains/app/models/util/format
 *
 * Pure functions, no state, no IO. Consumers across the dashboard,
 * devtools, and chat strip use these to render numeric facts (MB/GB,
 * load errors) the same way everywhere.
 */

import type { LoadError } from "#lib/sys/generated/bindings.js";

/**
 * Format a megabyte count to a human-readable string.
 *
 * - `< 1024` MB → `"512 MB"`
 * - `>= 1024` MB → `"1.2 GB"` (one decimal)
 *
 * Used for VRAM displays, model size badges, and download progress.
 */
export function formatMb(mb: number): string {
	if (mb < 1024) return `${mb} MB`;
	return `${(mb / 1024).toFixed(1)} GB`;
}

/**
 * Format raw bytes to a human-readable string.
 *
 * Tiered B / KB / MB / GB output, one decimal. Used by download
 * progress, repo file listings, etc.
 */
export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Render a structured `LoadError` (from the kernel) as a one-line
 * layman string suitable for badges + toasts. The kernel ships
 * structured kinds; this collapses them into a sentence the user
 * can read without opening a debug panel.
 */
export function formatLoadError(error: LoadError | string | null | undefined): string {
	if (!error) return "Unknown error";
	if (typeof error === "string") return error;

	switch (error.kind) {
		case "unknown-architecture":
			return `Unknown model architecture (${error.raw}). File an issue if you expected this to work.`;
		case "unsupported-architecture":
			return `This model's file format isn't supported on the chosen backend yet.`;
		case "missing-file":
			return `Model file is missing on disk — re-scan or re-download.`;
		case "model-corrupt":
			return `Model file is corrupt or truncated — re-download to fix.`;
		case "model-file-missing":
			return `Registry referenced a file that no longer exists on disk.`;
		case "vram-insufficient":
			return `Not enough VRAM to load this model on the GPU (needs ${error.needed_mb} MB, ${error.available_mb} MB free).`;
		case "ram-exhausted":
			return `Not enough RAM available (used ${error.used_mb} MB of ${error.total_mb} MB).`;
		case "disk-full":
			return `Not enough disk space (needs ${error.needed_mb} MB, ${error.available_mb} MB free).`;
		case "no-gpu-driver":
			return `No GPU driver detected — install one or pick a CPU-only preset.`;
		case "download-failed":
			return `Download failed: ${error.reason}${error.can_retry ? " — retry to resume." : ""}`;
		case "slot-not-found":
			return `Slot ${error.slot_id} isn't registered.`;
		case "no-model-assigned":
			return `Slot ${error.slot_id} has no model assigned yet — pick one in the wizard.`;
		case "already-loading":
		case "slot-swapping":
			return "Another load is already in progress for this slot.";
		case "incompatible-model":
			return `This model doesn't satisfy the ${error.capability} capability for the slot.`;
		case "io-failed":
		case "config-corrupt":
		case "config-backend-failed":
		case "tokenizer-load":
		case "backend-init":
		case "inference-failed":
		case "boot-failed":
		case "hugging-face-api":
		case "other":
			// Backend-internal failures — surface the JSON so the devtool
			// can capture exact context. Customer-facing surfaces should
			// wrap this with a friendlier "retry / contact" hint.
			return JSON.stringify(error);
		default:
			// Exhaustive switch guard. If a new LoadError variant lands
			// the union without an arm here, the assignment below trips
			// at type-check time so the gap is impossible to miss.
			return ((_: never) => JSON.stringify(error))(error);
	}
}
