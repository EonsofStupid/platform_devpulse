/**
 * @file DuckDB Service — Tauri IPC wrappers.
 * @module @devpulse/domains/infra/duckdb/data-access/duckdb
 */

import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";
import type { DuckDbHealth, DuckDbQueryResult, DuckDbTableInfo } from "../util/duckdb.types.js";

export async function duckdbHealth(): Promise<DuckDbHealth> {
	logInfo("duckdb.svc", "duckdbHealth()");
	const result = await commands.duckdbHealth();
	if (result.status === "error") {
		logError("duckdb.svc", `duckdbHealth() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}

export async function duckdbListTables(): Promise<DuckDbTableInfo[]> {
	logInfo("duckdb.svc", "duckdbListTables()");
	const result = await commands.duckdbListTables();
	if (result.status === "error") {
		logError("duckdb.svc", `duckdbListTables() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}

export async function duckdbQuery(sql: string): Promise<DuckDbQueryResult> {
	logInfo("duckdb.svc", `duckdbQuery(${sql.slice(0, 60)}...)`);
	const result = await commands.duckdbQuery(sql);
	if (result.status === "error") {
		logError("duckdb.svc", `duckdbQuery() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}
