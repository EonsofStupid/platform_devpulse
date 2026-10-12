/**
 * @file Turso State Rune — the database devtool's view of Rust's data.
 * @module @devpulse/domains/infra/turso/data-access/turso.state
 *
 * Holds what Rust last returned; every change goes through Rust, which
 * checks it against the table's columns, and the row Rust stores replaces
 * the one shown. Nothing here computes a row.
 */

import {
	type CellChange,
	type MigrationStatus,
	PAGE_SIZE,
	type RowPage,
	type SqlOutcome,
	type TableSummary,
	type TursoDatabase,
	type TursoHealth,
} from "../util/turso.types.js";
import {
	deleteRow,
	insertRow,
	loadHealth,
	loadMigrations,
	loadRows,
	loadTables,
	runSql,
	updateRow,
} from "./turso.service.js";

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

class TursoState {
	database = $state<TursoDatabase>("User");

	// ── Health ──────────────────────────────────────────────
	health = $state<TursoHealth[] | null>(null);
	healthLoading = $state(false);
	healthError = $state<string | null>(null);

	// ── Tables ──────────────────────────────────────────────
	tables = $state<TableSummary[]>([]);
	tablesLoading = $state(false);
	tablesError = $state<string | null>(null);

	// ── Rows of the open table ──────────────────────────────
	page = $state<RowPage | null>(null);
	pageLoading = $state(false);
	pageError = $state<string | null>(null);

	// ── Migrations ──────────────────────────────────────────
	migrations = $state<MigrationStatus[]>([]);
	migrationsLoading = $state(false);
	migrationsError = $state<string | null>(null);

	// ── Console ─────────────────────────────────────────────
	sql = $state("");
	outcome = $state<SqlOutcome | null>(null);
	running = $state(false);
	consoleError = $state<string | null>(null);
	sqlHistory = $state<string[]>([]);

	get reachableCount(): number {
		return this.health?.filter((d) => d.reachable).length ?? 0;
	}

	async refreshHealth(): Promise<void> {
		this.healthLoading = true;
		this.healthError = null;
		try {
			this.health = await loadHealth();
		} catch (e) {
			this.healthError = message(e);
		} finally {
			this.healthLoading = false;
		}
	}

	async selectDatabase(database: TursoDatabase): Promise<void> {
		this.database = database;
		this.page = null;
		this.outcome = null;
		await Promise.all([this.refreshTables(), this.refreshMigrations()]);
	}

	async refreshTables(): Promise<void> {
		this.tablesLoading = true;
		this.tablesError = null;
		try {
			this.tables = await loadTables(this.database);
		} catch (e) {
			this.tablesError = message(e);
		} finally {
			this.tablesLoading = false;
		}
	}

	async refreshMigrations(): Promise<void> {
		this.migrationsLoading = true;
		this.migrationsError = null;
		try {
			this.migrations = await loadMigrations(this.database);
		} catch (e) {
			this.migrationsError = message(e);
		} finally {
			this.migrationsLoading = false;
		}
	}

	/** Open a table at a row offset (first page by default). */
	async openTable(table: string, offset = 0): Promise<void> {
		this.pageLoading = true;
		this.pageError = null;
		try {
			this.page = await loadRows(this.database, table, offset, PAGE_SIZE);
		} catch (e) {
			this.pageError = message(e);
		} finally {
			this.pageLoading = false;
		}
	}

	closeTable(): void {
		this.page = null;
		this.pageError = null;
	}

	/**
	 * Save a row: update `rowid` with `changes`, or add a new row when
	 * `rowid` is null. Throws Rust's message when the change is refused.
	 */
	async saveRow(rowid: number | null, changes: CellChange[]): Promise<void> {
		const page = this.page;
		if (!page) return;
		if (rowid === null) {
			await insertRow(this.database, page.table, changes);
			// A new row lands at the end of the table: reload so the page and
			// the count match what is stored.
			await this.openTable(page.table, page.offset);
		} else {
			const row = await updateRow(this.database, page.table, rowid, changes);
			this.page = { ...page, rows: page.rows.map((r) => (r.rowid === row.rowid ? row : r)) };
		}
		await this.refreshTables();
	}

	/** Delete a row. Throws Rust's message when it fails. */
	async removeRow(rowid: number): Promise<void> {
		const page = this.page;
		if (!page) return;
		await deleteRow(this.database, page.table, rowid);
		await Promise.all([this.openTable(page.table, page.offset), this.refreshTables()]);
	}

	async runConsole(): Promise<void> {
		const sql = this.sql.trim();
		if (!sql) return;
		this.running = true;
		this.consoleError = null;
		this.outcome = null;
		try {
			this.outcome = await runSql(this.database, sql);
			this.sqlHistory = [sql, ...this.sqlHistory.filter((q) => q !== sql)].slice(0, 20);
			if (this.outcome.rowsAffected > 0) await this.refreshTables();
		} catch (e) {
			this.consoleError = message(e);
		} finally {
			this.running = false;
		}
	}
}

export const tursoState = new TursoState();
