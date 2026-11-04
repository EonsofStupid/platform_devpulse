/**
 * @module @devpulse/domains/infra/surreal
 *
 * Public API for the SurrealDB domain. Routes and other domains MUST import
 * from this file. Never reach into `data-access/` or `util/` directly.
 *
 * Layout (Nx library-types, LOCKED 2026-04-14):
 *   util/         — pure types, namespace options
 *   data-access/  — rune state + Tauri IPC services
 *
 * Surface groups:
 *   - **Graph data plane** — query / list-tables / kv-list / health for
 *     the live SurrealDB endpoint. State: `surrealState`.
 *   - **Sidecar lifecycle** — managed-process status / health / config.
 *     State: `surrealSidecarState`.
 *
 * Both halves talk to the same managed SurrealDB child; they're split
 * purely so the devtool can mount each verb group on its own tab.
 */

export type {
	SurrealHealth,
	SurrealStatus,
	SurrealUserConfig,
} from "#lib/sys/bindings/surreal/index.js";
export { surrealSidecarState } from "./data-access/sidecar.state.svelte.js";
export {
	surrealConfigLoad,
	surrealConfigSave,
	surrealHealth,
	surrealStatus,
} from "./data-access/sidecar.svc.js";
export { surrealState } from "./data-access/surreal.state.svelte.js";
export {
	graphHealthAll,
	graphKvList,
	graphListTables,
	graphQuery,
	graphStats,
	pingGraph,
} from "./data-access/surreal.svc.js";
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
export { NAMESPACE_OPTIONS } from "./util/surreal.types.js";
