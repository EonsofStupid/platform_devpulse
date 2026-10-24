/**
 * @file sys/bindings/sys/relational/index.ts
 * @module @devpulse/sys/bindings/sys/relational
 * @description Turso IPC facade — the database devtool's surface.
 *
 * Health, tables, row editing, migration history and the SQL console for
 * the system and user databases. The table editor (and every check on a
 * change) lives in the engine (`systems/devpulse-engine/src/platform/db/
 * editor.rs`); the Tauri commands are thin wrappers
 * (`interfaces/desktop/src-tauri/src/commands/sys/relational.rs`).
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const tursoHealthAll = commands.tursoHealthAll;
export const tursoListTables = commands.tursoListTables;
export const tursoTableRows = commands.tursoTableRows;
export const tursoUpdateRow = commands.tursoUpdateRow;
export const tursoInsertRow = commands.tursoInsertRow;
export const tursoDeleteRow = commands.tursoDeleteRow;
export const tursoMigrations = commands.tursoMigrations;
export const tursoQuery = commands.tursoQuery;

export type {
	Affinity,
	Cell,
	CellChange,
	Column,
	MigrationStatus,
	Row,
	RowPage,
	SqlOutcome,
	TableSummary,
	TursoDatabase,
	TursoHealth,
} from "$lib/sys/generated/bindings.js";
