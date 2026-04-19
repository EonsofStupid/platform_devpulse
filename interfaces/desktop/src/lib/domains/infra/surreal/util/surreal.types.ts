/**
 * @file SurrealDB Types — re-exported from specta bindings.
 * @module @devpulse/domains/infra/surreal/util/surreal.types
 *
 * Pure types. No runtime. No imports beyond bindings.
 */

// Re-export specta-generated types so the domain has its own type surface.
// These will exist once cargo check regenerates bindings.ts.
export type {
	GraphHealthAll,
	GraphKvEntry,
	GraphNamespace,
	GraphNamespaceStats,
	GraphPingResult,
	GraphTableInfo,
} from "$lib/sys/generated/bindings.js";

/** Devtool tab identifiers. */
export type SurrealTab = "health" | "browser" | "console";

/** Namespace option for the UI selector. */
export interface NamespaceOption {
	label: string;
	value: GraphNamespace;
	description: string;
}

/** All three namespace options. */
export const NAMESPACE_OPTIONS: NamespaceOption[] = [
	{ label: "System", value: "System", description: "system/engine — FSM, thinking, quality" },
	{ label: "User", value: "User", description: "user/profile — memory, corrections, concepts" },
	{ label: "Global", value: "Global", description: "global/knowledge — patterns, dev profile" },
];
