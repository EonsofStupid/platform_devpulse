/**
 * @file Turso Service — Tauri IPC wrappers.
 * @module @devpulse/domains/infra/turso/data-access/turso
 */

import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";
import type {
	TursoDatabase,
	TursoHealthAll,
	TursoQueryResult,
	TursoTableInfo,
} from "../util/turso.types.js";

export async function tursoHealthAll(): Promise<TursoHealthAll> {
	logInfo("turso.service", "tursoHealthAll()");
	const result = await commands.tursoHealthAll();
	if (result.status === "error") {
		logError("turso.service", `tursoHealthAll() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}

export async function tursoListTables(database: TursoDatabase): Promise<TursoTableInfo[]> {
	logInfo("turso.service", `tursoListTables(${database})`);
	const result = await commands.tursoListTables(database);
	if (result.status === "error") {
		logError("turso.service", `tursoListTables() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}

export async function tursoQuery(database: TursoDatabase, sql: string): Promise<TursoQueryResult> {
	logInfo("turso.service", `tursoQuery(${database}, ${sql.slice(0, 60)}...)`);
	const result = await commands.tursoQuery(database, sql);
	if (result.status === "error") {
		logError("turso.service", `tursoQuery() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}
