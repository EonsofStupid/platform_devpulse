/**
 * @file Compatibility Service — TS layer over the kernel registry.
 * @module @devpulse/domains/app/models/data-access/compatibility
 *
 * Wraps the two backend-matrix Tauri commands in typed helpers:
 *
 * - `fetchBackendMatrix()` — one-shot query for the full
 *   architecture × backend grid, cached by the caller in a rune.
 * - `resolveRepoCompatibility()` — pre-download gate. Given an HF
 *   `architectures[0]` string, an optional `model_type`, and the
 *   target file format, asks the kernel resolver if the request is
 *   loadable. Returns either a concrete `Ok` plan (backend id +
 *   advisory notes) or an `Unsupported` result carrying a typed
 *   reason and the alternatives list ordered by tier.
 *
 * Types come from `$lib/sys/generated/bindings.js` — specta is the
 * single source of truth, no hand-authored stubs, no drift. When the
 * kernel registry gains a new architecture or backend, the regen
 * flows through automatically and any breaking change surfaces as a
 * TypeScript error here first.
 */

import type {
	Alternative,
	ArchitectureSpec,
	BackendInfo,
	BackendMatrix,
	ModelFormat,
	Resolution,
} from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";

export type {
	Alternative,
	AlternativeKind,
	ArchFamily,
	ArchId,
	ArchitectureSpec,
	BackendId,
	BackendInfo,
	BackendMatrix,
	FormatSupport,
	ModelFormat,
	Resolution,
	SupportStatus,
	SupportTier,
	UnsupportedReason,
} from "$lib/sys/generated/bindings.js";

/** Unwrap a specta Result or throw with a clear prefix. */
function unwrap<T>(
	result: { status: "ok"; data: T } | { status: "error"; error: string },
	label: string,
): T {
	if (result.status === "ok") return result.data;
	throw new Error(`${label}: ${result.error}`);
}

/**
 * Fetch the full backend compatibility matrix.
 *
 * Called once on boot from `modelBackendMatrix.svelte.ts` and cached
 * for the session. Cheap server-side — backs a static const array.
 */
export async function fetchBackendMatrix(): Promise<BackendMatrix> {
	logInfo("models.compatibility", "Fetching backend matrix");
	try {
		const matrix = unwrap(await commands.listBackendMatrix(), "listBackendMatrix failed");
		logInfo(
			"models.compatibility",
			`Matrix: ${matrix.backends.length} backends × ${matrix.architectures.length} architectures`,
		);
		return matrix;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.compatibility", `fetchBackendMatrix FAILED: ${msg}`);
		throw new Error(`Backend matrix fetch failed: ${msg}`);
	}
}

/**
 * Pre-download gate. Ask the kernel whether a `(arch, format)` pair
 * is loadable in this build.
 *
 * The caller typically fetches `architectures[0]` and `model_type`
 * from the HF repo's `config.json` before invoking this. For GGUF
 * requests without a HF config, pass the GGUF
 * `general.architecture` value as `archRaw`.
 *
 * Returns:
 * - `{ kind: "ok", backend, notes }` — safe to proceed with the
 *   download. `notes` is a (possibly empty) list of advisory
 *   strings the UI should display before the download button.
 * - `{ kind: "unsupported", arch, format, reason, alternatives }` —
 *   block the download. Render the reason + alternatives. Each
 *   alternative has a `kind` (switch-format / switch-quant /
 *   switch-model / upgrade-build) so the UI can pick the right
 *   affordance.
 */
export async function resolveRepoCompatibility(
	archRaw: string,
	modelType: string | null,
	format: ModelFormat,
): Promise<Resolution> {
	logInfo(
		"models.compatibility",
		`Resolving compatibility: arch=${archRaw} model_type=${modelType ?? "-"} format=${format}`,
	);
	try {
		const resolution = unwrap(
			await commands.resolveArchitectureCompatibility(archRaw, modelType, format),
			"resolveArchitectureCompatibility failed",
		);
		logInfo("models.compatibility", `Resolution: ${resolution.kind}`);
		return resolution;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.compatibility", `resolveRepoCompatibility FAILED: ${msg}`);
		throw new Error(`Compatibility resolve failed: ${msg}`);
	}
}

/**
 * Look up a single architecture spec inside a matrix.
 *
 * Matrix rows are static, so after the first `fetchBackendMatrix()`
 * call this is a synchronous lookup.
 */
export function getArchitecture(
	matrix: BackendMatrix,
	archId: ArchitectureSpec["id"],
): ArchitectureSpec | undefined {
	return matrix.architectures.find((spec) => spec.id === archId);
}

/**
 * Installed + declared support filter. Returns every
 * `(backend, format)` pair in the matrix that can load the given
 * architecture and whose backend feature flag is compiled in.
 */
export function installedSupportFor(
	matrix: BackendMatrix,
	archId: ArchitectureSpec["id"],
): Array<{ backend: BackendInfo; format: ModelFormat }> {
	const hits: Array<{ backend: BackendInfo; format: ModelFormat }> = [];
	for (const backend of matrix.backends) {
		if (!backend.installed) continue;
		for (const support of backend.supports) {
			if (support.arch === archId) {
				hits.push({ backend, format: support.format });
			}
		}
	}
	return hits;
}

/**
 * Render a compact text summary of a resolution for the download
 * button tooltip. Layman-friendly — no backend ids, no kernel terms.
 */
export function formatResolutionSummary(resolution: Resolution): string {
	if (resolution.kind === "ok") {
		if (resolution.notes.length === 0) return "Ready to download";
		return `Ready — ${resolution.notes[0]}`;
	}
	switch (resolution.reason.kind) {
		case "format-not-wired":
			return "This format isn't supported for this model yet";
		case "backend-not-installed":
			return "Requires a newer build of DevPulse";
		case "planned-slot":
			return "Coming in a future update";
		case "legacy-disabled":
			return "This model is deprecated; a newer version is available";
		default:
			return "Not supported in this build";
	}
}

/** Convenience: is this resolution safe to proceed with? */
export function canProceed(resolution: Resolution): resolution is Resolution & { kind: "ok" } {
	return resolution.kind === "ok";
}

/** Convenience: get the alternatives list from any resolution type. */
export function alternativesOf(resolution: Resolution): Alternative[] {
	return resolution.kind === "unsupported" ? resolution.alternatives : [];
}

/**
 * Render a `LoadError` as a human-readable one-line string.
 *
 * Bridge between the typed Tauri command layer and legacy call
 * sites that still expect `throw new Error(string)`. The canonical
 * consumer should pattern-match on the `LoadError` variant and
 * render interactive UI (alternatives, retry buttons). Only use
 * `formatLoadError` at the string boundary.
 */
export function formatLoadError(err: import("$lib/sys/generated/bindings.js").LoadError): string {
	switch (err.kind) {
		case "unknown-architecture":
			return `Unknown architecture '${err.raw}' — not in the registry.`;
		case "unsupported-architecture":
			return `${err.arch} in ${err.format} format is not loadable in this build.`;
		case "missing-file":
			return `Required file '${err.which}' missing in ${err.dir}.`;
		case "model-corrupt":
			return `Model file corrupt: ${err.path}${err.can_redownload ? " (re-download available)" : ""}.`;
		case "model-file-missing":
			return `Model file missing: ${err.path}${err.slot_id ? ` (slot ${err.slot_id})` : ""}.`;
		case "vram-insufficient":
			return `Not enough GPU memory: need ${err.needed_mb} MB, only ${err.available_mb} MB free.`;
		case "ram-exhausted":
			return `System out of RAM: ${err.used_mb}/${err.total_mb} MB.`;
		case "disk-full":
			return `Disk space insufficient: need ${err.needed_mb} MB, only ${err.available_mb} MB free.`;
		case "no-gpu-driver":
			return "GPU driver not found — falling back to CPU.";
		case "download-failed":
			return `Download failed: ${err.reason}${err.can_retry ? " (retry available)" : ""}.`;
		case "slot-not-found":
			return `Slot '${err.slot_id}' does not exist.`;
		case "no-model-assigned":
			return `No model assigned to slot '${err.slot_id}'.`;
		case "already-loading":
			return `Slot '${err.slot_id}' is already loading.`;
		case "slot-swapping":
			return `Slot '${err.slot_id}' is swapping models — try again in a moment.`;
		case "incompatible-model":
			return `Model '${err.model_id}' is not compatible with slot capability '${err.capability}'.`;
		case "config-corrupt":
			return `Config data corrupt${err.recovered ? " — recovered to defaults" : " — recovery failed"}.`;
		case "backend-init":
			return `Backend ${err.backend} failed to init: ${err.message}`;
		case "tokenizer-load":
			return `Tokenizer load failed: ${err.message}`;
		case "other":
			return err.message;
	}
}
