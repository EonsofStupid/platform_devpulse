/**
 * @file LibSQL Service — Tauri IPC wrappers.
 * @module @devpulse/domains/infra/libsql/data-access/libsql
 */

import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";
import type {
	LibSqlDatabase,
	LibSqlHealthAll,
	LibSqlQueryResult,
	LibSqlTableInfo,
} from "../util/libsql.types.js";

export async function libsqlHealthAll(): Promise<LibSqlHealthAll> {
	logInfo("libsql.svc", "libsqlHealthAll()");
	const result = await commands.libsqlHealthAll();
	if (result.status === "error") {
		logError("libsql.svc", `libsqlHealthAll() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}

export async function libsqlListTables(database: LibSqlDatabase): Promise<LibSqlTableInfo[]> {
	logInfo("libsql.svc", `libsqlListTables(${database})`);
	const result = await commands.libsqlListTables(database);
	if (result.status === "error") {
		logError("libsql.svc", `libsqlListTables() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}

export async function libsqlQuery(
	database: LibSqlDatabase,
	sql: string,
): Promise<LibSqlQueryResult> {
	logInfo("libsql.svc", `libsqlQuery(${database}, ${sql.slice(0, 60)}...)`);
	const result = await commands.libsqlQuery(database, sql);
	if (result.status === "error") {
		logError("libsql.svc", `libsqlQuery() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}
