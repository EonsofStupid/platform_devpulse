/**
 * @file Turso Service — Tauri IPC wrappers that turn a command's error
 * result into a thrown `Error` carrying Rust's message.
 * @module @devpulse/domains/infra/turso/data-access/turso
 */

import type { Result } from "#lib/sys/bindings/_shared/index.js";
import {
	tursoDeleteRow,
	tursoHealthAll,
	tursoInsertRow,
	tursoListTables,
	tursoMigrations,
	tursoQuery,
	tursoTableRows,
	tursoUpdateRow,
} from "#lib/sys/bindings/sys/relational/index.js";
import { logError } from "#lib/sys/logger.js";
import type {
	CellChange,
	MigrationStatus,
	Row,
	RowPage,
	SqlOutcome,
	TableSummary,
	TursoDatabase,
	TursoHealth,
} from "../util/turso.types.js";

async function unwrap<T>(name: string, call: Promise<Result<T, string>>): Promise<T> {
	const result = await call;
	if (result.status === "error") {
		logError("turso.service", `${name} failed: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}

export const loadHealth = (): Promise<TursoHealth[]> => unwrap("tursoHealthAll", tursoHealthAll());

export const loadTables = (database: TursoDatabase): Promise<TableSummary[]> =>
	unwrap("tursoListTables", tursoListTables(database));

export const loadRows = (
	database: TursoDatabase,
	table: string,
	offset: number,
	limit: number,
): Promise<RowPage> => unwrap("tursoTableRows", tursoTableRows(database, table, offset, limit));

export const updateRow = (
	database: TursoDatabase,
	table: string,
	rowid: number,
	changes: CellChange[],
): Promise<Row> => unwrap("tursoUpdateRow", tursoUpdateRow(database, table, rowid, changes));

export const insertRow = (
	database: TursoDatabase,
	table: string,
	values: CellChange[],
): Promise<Row> => unwrap("tursoInsertRow", tursoInsertRow(database, table, values));

export const deleteRow = (database: TursoDatabase, table: string, rowid: number): Promise<null> =>
	unwrap("tursoDeleteRow", tursoDeleteRow(database, table, rowid));

export const loadMigrations = (database: TursoDatabase): Promise<MigrationStatus[]> =>
	unwrap("tursoMigrations", tursoMigrations(database));

export const runSql = (database: TursoDatabase, sql: string): Promise<SqlOutcome> =>
	unwrap("tursoQuery", tursoQuery(database, sql));
