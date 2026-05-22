/**
 * @file SurrealDB Types — re-exported from specta bindings.
 * @module @devpulse/domains/infra/surreal/util/surreal.types
 *
 * Pure types. No runtime. No imports beyond bindings.
 */

// Import the specta-generated types so the domain has its own type surface.
// `GraphNamespace` is also referenced as a value-position type within this
// file (see `NamespaceOption`), so it must be imported (not just re-exported)
// to land in the file's type scope.
import type {
	GraphHealthAll,
	GraphKvEntry,
	GraphNamespace,
	GraphNamespaceStats,
	GraphPingResult,
	GraphTableInfo,
} from "$lib/sys/generated/bindings.js";

export type {
	GraphHealthAll,
	GraphKvEntry,
	GraphNamespace,
	GraphNamespaceStats,
	GraphPingResult,
	GraphTableInfo,
};

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
