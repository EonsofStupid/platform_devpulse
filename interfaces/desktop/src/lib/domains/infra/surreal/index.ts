/**
 * @module @devpulse/domains/infra/surreal
 *
 * Public API for the SurrealDB domain. Routes and other domains MUST import
 * from this file. Never reach into `data-access/` or `util/` directly.
 *
 * Layout (Nx library-types, LOCKED 2026-04-14):
 *   util/         — pure types, namespace options
 *   data-access/  — rune state + Tauri IPC services
 */

// ── State ───────────────────────────────────────────────────
export { surrealState } from "./data-access/surreal.state.svelte.js";

// ── Services ────────────────────────────────────────────────
export {
	graphHealthAll,
	graphKvList,
	graphListTables,
	graphQuery,
	graphStats,
	pingGraph,
} from "./data-access/surreal.svc.js";

// ── Types ───────────────────────────────────────────────────
export type {
	GraphHealthAll,
	GraphKvEntry,
	GraphNamespace,
	GraphNamespaceStats,
	GraphPingResult,
	GraphTableInfo,
	NamespaceOption,
	SurrealTab,
} from "./util/surreal.types.js";

// ── Constants ───────────────────────────────────────────────
export { NAMESPACE_OPTIONS } from "./util/surreal.types.js";
