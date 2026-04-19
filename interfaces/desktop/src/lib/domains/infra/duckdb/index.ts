/**
 * @module @devpulse/domains/infra/duckdb
 *
 * Public API for the DuckDB devtools domain.
 */

export { duckdbState } from "./data-access/duckdb.state.svelte.js";
export { duckdbHealth, duckdbListTables, duckdbQuery } from "./data-access/duckdb.svc.js";
export type {
	DuckDbHealth,
	DuckDbQueryResult,
	DuckDbTab,
	DuckDbTableInfo,
} from "./util/duckdb.types.js";
