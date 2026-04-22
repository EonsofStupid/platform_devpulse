/**
 * Shared devtool types — axis taxonomy, health states, tab metadata.
 *
 * Kept in a plain `.ts` file (not inside `ServiceDevtoolShell.svelte`)
 * so every per-service domain can import them cleanly from the barrel
 * without fighting Svelte's `.svelte` type re-export rules.
 */

import type { Component } from "svelte";

/**
 * Axis placement — mirrors the `config/platform/{axis}/` folder and the
 * engine's `ModuleAxis` enum. Used to derive color accent + breadcrumb
 * label in the devtool shell.
 */
export type ServiceAxis = "runtime" | "stores" | "runtimes" | "capabilities" | "integrations";

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
 * A per-service domain-specific tab appended after the four standard
 * tabs. Use for tooling that only makes sense for one service
 * (e.g. LibSQL's SQL Console, SurrealDB's namespace selector).
 */
export interface ExtraTab {
	/** Unique tab id. Prefix with the module id if collisions are possible. */
	id: string;
	/** Short label shown in the tab strip. */
	label: string;
	/**
	 * Optional lucide icon component. The props signature matches every
	 * other icon used in the shell header + standard tabs.
	 */
	// biome-ignore lint/suspicious/noExplicitAny: lucide icons share a well-known props shape; narrow typing here fights Svelte's generics.
	Icon?: Component<any>;
}
