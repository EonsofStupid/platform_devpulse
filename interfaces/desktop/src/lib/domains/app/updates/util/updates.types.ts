/**
 * @file Update domain types — mirror of the Rust surface.
 * @module @devpulse/domains/app/updates/util
 *
 * Types match the kebab-case Rust shapes emitted by tauri-specta. Hand-
 * mirrored here until `cargo xtask regen-bindings` runs and `bindings.ts`
 * carries the generated counterparts; the file-local types fall through
 * to those names so the rune state can switch over without consumer churn.
 */

/** Channel slug persisted in `{data_dir}/user/updates.json`. */
export type UpdateChannel = "stable" | "beta" | "nightly";

/** Result of [`check_for_update`]. */
export interface UpdateInfo {
	/** Whether the endpoint advertised a newer version. */
	available: boolean;
	/** Version baked into this binary. */
	currentVersion: string;
	/** Version offered by the endpoint, when one is offered. */
	latestVersion: string | null;
	/** Release notes from `latest.json` (markdown body). */
	notes: string | null;
	/** ISO-8601 publish timestamp from `latest.json`. */
	publishedAt: string | null;
}

/** Streamed progress during update download. */
export interface UpdateDownloadProgressPayload {
	downloadedBytes: number;
	totalBytes: number | null;
}

/** Lifecycle phase the rune surfaces to the UI. */
export type UpdateLifecyclePhase =
	| "idle"
	| "checking"
	| "available"
	| "downloading"
	| "restarting"
	| "error";
