/**
 * @file Layman-friendly formatters for model loader UI.
 * @module @devpulse/domains/app/models/util/format
 *
 * Pure functions, no state, no IO. Consumers across the dashboard,
 * devtools, and chat strip use these to render numeric facts (MB/GB,
 * load errors) the same way everywhere.
 */

import type { LoadError } from "$lib/sys/generated/bindings.js";

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
		case "no-backend":
			return `No backend can load this model in the requested format yet.`;
		case "format-unsupported":
			return `This model's file format isn't supported on the chosen backend.`;
		case "missing-file":
			return `Model file is missing on disk — re-scan or re-download.`;
		case "vram-too-low":
			return `Not enough VRAM to load this model on the GPU.`;
		case "io-error":
			return `Couldn't read the model file.`;
		case "backend-error":
			return error.message ? `Backend error: ${error.message}` : "Backend error during load.";
		default:
			// Unknown discriminant — surface verbatim so we don't hide a real error.
			return JSON.stringify(error);
	}
}
