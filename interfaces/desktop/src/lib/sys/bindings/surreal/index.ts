/**
 * @file sys/bindings/surreal/index.ts
 * @module @devpulse/sys/bindings/surreal
 * @description Surreal IPC facade — clyffy's persistence backend.
 *
 * SurrealDB on devpulse is the **full server**, run as a managed sidecar
 * by the engine (never embedded mode). It serves as clyffy's graph
 * persistence layer (`kernel/devpulse-clyffy/cortex/persistence`). This
 * facade exposes both halves of the surface as one domain — sidecar
 * lifecycle and graph data-plane are verb groups within a single
 * managed service, not separate concerns.
 *
 * # Why a facade, not direct generated imports
 *
 * Domain code stays insulated from the generated monolith — when a
 * specta type or command name changes, only this file moves.
 *
 * Lifecycle types and Tauri command names are canonical — Tauri command
 * surfaces match the engine method shape one-to-one (`surreal_status`,
 * `surreal_health`, `surreal_config_load`, `surreal_config_save`). The
 * graph data-plane types still live as `Graph*` in `commands/sys/graph.rs`
 * (intentionally — they're the data-plane vocabulary, not Surreal-specific)
 * and are aliased to `Surreal*` here so the domain sees a single coherent
 * type namespace.
 *
 * # Where the underlying Rust lives
 *
 * - Sidecar lifecycle (Tauri): `interfaces/desktop/src-tauri/src/commands/surreal/sidecar/`
 * - Graph data plane: `interfaces/desktop/src-tauri/src/commands/sys/graph.rs`
 * - Engine service: `systems/devpulse-engine/src/platform/services/sidecars/surreal/service.rs`
 * - Kernel consumer: `kernel/devpulse-clyffy/src/cortex/persistence/surreal/`
 */

import { commands } from "$lib/sys/generated/bindings.js";

// ── Sidecar lifecycle ────────────────────────────────────────────
//
// These are the verbs the operator (you) runs through the devtool to
// inspect / configure the managed SurrealDB child process.

/** Read the running-state snapshot of the managed SurrealDB child. */
export const surrealStatus = commands.surrealStatus;

/** Read the tri-state health badge for the Status tab. */
export const surrealHealth = commands.surrealHealth;

/** Load the user-scope SurrealDB config from `{data_dir}/user/`. */
export const surrealConfigLoad = commands.surrealConfigLoad;

/** Persist the user-scope SurrealDB config (atomic write). */
export const surrealConfigSave = commands.surrealConfigSave;

// ── Graph data plane ─────────────────────────────────────────────
//
// These hit the live SurrealDB endpoint that the sidecar above is
// fronting. Targeted by namespace (System / User / Global).

/** Ping a single graph namespace and report latency + reachability. */
export const surrealPing = commands.pingGraph;

/** Health probe across all namespaces + the HTTP server. */
export const surrealHealthAll = commands.graphHealthAll;

/** Enumerate tables in a namespace with record counts. */
export const surrealListTables = commands.graphListTables;

/** Per-namespace stats (table count, total records, breakdown). */
export const surrealStats = commands.graphStats;

/** Run an ad-hoc SurrealQL query against a namespace. */
export const surrealQuery = commands.graphQuery;

/** Enumerate the scoped key-value entries for a namespace. */
export const surrealKvList = commands.graphKvList;

// ── Types ────────────────────────────────────────────────────────
//
// `Graph*` types still come from the data-plane Rust naming (kernel
// keeps them as `Graph*` under sys::graph), so they're aliased to
// `Surreal*` at the facade boundary. The lifecycle types
// (`SurrealStatus`, `SurrealHealth`, `SurrealUserConfig`) are now
// canonical post-consolidation — no alias needed.

export type {
	GraphHealthAll as SurrealHealthAll,
	GraphKvEntry as SurrealKvEntry,
	GraphNamespace as SurrealNamespace,
	GraphNamespaceStats as SurrealNamespaceStats,
	GraphPingResult as SurrealPingResult,
	GraphTableInfo as SurrealTableInfo,
	SurrealHealth,
	SurrealStatus,
	SurrealUserConfig,
} from "$lib/sys/generated/bindings.js";
