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
 * # The names exposed here are the **target canonical names**
 *
 * Today the underlying generated symbols are still
 * `surrealdbSidecarStatus`, `SurrealdbSidecarStatus`, etc. — that's
 * the pre-consolidation Rust naming. This facade renames them at the
 * boundary so consumers always see `surrealStatus`, `SurrealStatus`,
 * etc. After the consolidation rename + `cargo xtask regen-bindings`,
 * only the right-hand sides in this file change. Consumers never move.
 *
 * # Where the underlying Rust lives
 *
 * - Sidecar lifecycle: `interfaces/desktop/src-tauri/src/commands/surrealdb_sidecar/`
 *   (will become `commands/surreal/`)
 * - Graph data plane: `interfaces/desktop/src-tauri/src/commands/sys/graph.rs`
 *   (already correctly named — these don't get renamed)
 * - Engine service: `systems/devpulse-engine/src/platform/services/surrealdb_sidecar.rs`
 *   (will become `services/surreal.rs`)
 * - Kernel consumer: `kernel/devpulse-clyffy/cortex/persistence/surreal.rs`
 */

import { commands } from "$lib/sys/generated/bindings.js";

// ── Sidecar lifecycle ────────────────────────────────────────────
//
// These are the verbs the operator (you) runs through the devtool to
// inspect / configure the managed SurrealDB child process.

/** Read the running-state snapshot of the managed SurrealDB child. */
export const surrealStatus = commands.surrealdbSidecarStatus;

/** Read the tri-state health badge for the Status tab. */
export const surrealHealth = commands.surrealdbSidecarHealth;

/** Load the user-scope SurrealDB config from `{data_dir}/user/`. */
export const surrealConfigLoad = commands.surrealdbSidecarConfigLoad;

/** Persist the user-scope SurrealDB config (atomic write). */
export const surrealConfigSave = commands.surrealdbSidecarConfigSave;

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
