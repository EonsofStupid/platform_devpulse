/**
 * Shared devtool types — health states, tab metadata.
 *
 * Kept in a plain `.ts` file (not inside `ServiceDevtoolShell.svelte`)
 * so every per-service domain can import them cleanly from the barrel
 * without fighting Svelte's `.svelte` type re-export rules. Where a page
 * sits (its bucket chip) comes from its route folder (plan 0008).
 */

/**
 * Layman-phrased health state shown as a colored dot + label in the
 * devtool shell header. Mirrors the engine's `ModuleHealth` variants,
 * minus the detail payload (which lives in the Status tab body).
 */
export type HealthState = "starting" | "up" | "degraded" | "down" | "stopped" | "unknown";

/**
 * Health badge props — what `ServiceDevtoolShell` renders in its header.
 */
export interface HealthBadge {
	/** Which colored dot to render. */
	state: HealthState;
	/**
	 * Layman-phrased label. Never surface raw Rust error strings here —
	 * translate to plain English (e.g. "Starting…", "Running",
	 * "Unreachable — see logs").
	 */
	label: string;
}

/**
 * Snapshot of a tab's text content for the shell-level Copy / Export
 * buttons. Returned from `ServiceDevtoolShell`'s `capture` prop on a
 * per-tab basis. Returning `undefined` for a given tab id hides both
 * buttons for that tab. Above 256 KiB Copy is auto-disabled
 * (clipboard pain) but Export remains available.
 */
export interface CapturePayload {
	/** Suggested filename (include extension). */
	filename: string;
	/** MIME — controls the export Blob and OS file association. */
	mime: "text/plain" | "application/json" | "text/csv";
	/** UTF-8 text payload. */
	content: string;
}

/**
 * A per-service domain-specific tab appended after the five standard
 * tabs. Use for tooling that only makes sense for one service
 * (e.g. Turso's SQL Console, SurrealDB's namespace selector).
 */
export interface ExtraTab {
	/** Unique tab id. Prefix with the module id if collisions are possible. */
	id: string;
	/** Short label shown in the tab strip. */
	label: string;
	/**
	 * Optional lucide icon component. Typed `any` because
	 * lucide-svelte v0.564 exports class-based icons
	 * (`SvelteComponentTyped<…>`), which structurally don't satisfy
	 * Svelte 5's function-form `Component<P, E, S>`. Narrow typing
	 * here causes assignment errors at every caller.
	 */
	// biome-ignore lint/suspicious/noExplicitAny: lucide-svelte class-based exports don't match Svelte 5 `Component<P>` function-form structurally.
	Icon?: any;
}
