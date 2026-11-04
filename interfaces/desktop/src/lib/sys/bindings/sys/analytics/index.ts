/**
 * @file sys/bindings/sys/analytics/index.ts
 * @description DuckDB analytics store devtool surface.
 */

import { commands } from "#lib/sys/generated/bindings.js";

export const duckdbHealth = commands.duckdbHealth;
export const duckdbListTables = commands.duckdbListTables;
export const duckdbQuery = commands.duckdbQuery;

export type {
	DuckDbHealth,
	DuckDbQueryResult,
	DuckDbTableInfo,
} from "#lib/sys/generated/bindings.js";
