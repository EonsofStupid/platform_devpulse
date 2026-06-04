/**
 * @file RRO Types
 * @module @devpulse/domains/sys/rro/util
 *
 * Re-exports specta wire types + domain-only computed types.
 * Wire types come from Rust via specta — never hand-edit them here.
 */

// ── Wire types (specta-generated) ───────────────────────────
export type {
	CollectionInfo,
	GraphHealthAll,
	GraphNamespace,
	GraphNamespaceStats,
	GraphPingResult,
	GraphTableInfo,
	RetrievalConfig,
	RetrievalParamMeta,
	RroDepth,
	RroState,
	RroStateSnapshot,
	RroStateTransition,
	SlotInfo,
	VectorHealthReport,
	VectorSearchResult,
} from "$lib/sys/generated/bindings.js";

// ── Domain-only types ───────────────────────────────────────

/** Tab identity. Must match capability IDs. `"brain"` is a
 *  trace-category that has no dedicated tab — `brain.svc.ts`
 *  groups its SurrealDB calls under this prefix so the log
 *  target reads `rro.brain.*`. */
export type RroTabId = "state" | "search" | "tuning" | "collections" | "encoder" | "brain";

/** Preset name (string union — custom means user-tuned away from named presets). */
export type PresetName = "conservative" | "balanced" | "aggressive" | "precision" | "custom";

/** Search quality bucket (for score distribution bar). */
export type ScoreBucket = 0 | 1 | 2 | 3 | 4;

/** Backend health state — used to gate capabilities. */
export type BackendState = "ready" | "degraded" | "unreachable" | "unknown";
