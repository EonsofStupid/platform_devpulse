/**
 * @file DuckDB Types — re-exported from specta bindings.
 * @module @devpulse/domains/infra/duckdb/util/duckdb.types
 */

export type {
	DuckDbHealth,
	DuckDbQueryResult,
	DuckDbTableInfo,
} from "#lib/sys/generated/bindings.js";

/** Devtool tab identifiers. */
export type DuckDbTab = "health" | "tables" | "console";
