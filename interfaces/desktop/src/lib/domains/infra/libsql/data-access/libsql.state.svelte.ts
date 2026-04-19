/**
 * @file LibSQL State Rune — reactive state for devtools.
 * @module @devpulse/domains/infra/libsql/data-access/libsql.state
 */

import type {
	LibSqlDatabase,
	LibSqlHealthAll,
	LibSqlQueryResult,
	LibSqlTab,
	LibSqlTableInfo,
} from "../util/libsql.types.js";
import { libsqlHealthAll, libsqlListTables, libsqlQuery } from "./libsql.svc.js";

class LibSqlState {
	// ── Tab + namespace ─────────────────────────────────────
	activeTab = $state<LibSqlTab>("health");
	activeDatabase = $state<LibSqlDatabase>("System");

	// ── Health ──────────────────────────────────────────────
	health = $state<LibSqlHealthAll | null>(null);
	healthLoading = $state(false);
	healthError = $state<string | null>(null);

	// ── Tables ──────────────────────────────────────────────
	tables = $state<LibSqlTableInfo[]>([]);
	tablesLoading = $state(false);
	tablesError = $state<string | null>(null);

	// ── Console ─────────────────────────────────────────────
	queryInput = $state("");
	queryResult = $state<LibSqlQueryResult | null>(null);
	queryLoading = $state(false);
	queryError = $state<string | null>(null);
	queryHistory = $state<string[]>([]);

	// ── Derived ─────────────────────────────────────────────
	get reachableCount(): number {
		return this.health?.databases.filter((d) => d.reachable).length ?? 0;
	}

	// ── Actions ─────────────────────────────────────────────
	setTab(tab: LibSqlTab): void {
		this.activeTab = tab;
	}

	setDatabase(db: LibSqlDatabase): void {
		this.activeDatabase = db;
		this.tables = [];
		this.queryResult = null;
	}

	async loadHealth(): Promise<void> {
		this.healthLoading = true;
		this.healthError = null;
		try {
			this.health = await libsqlHealthAll();
		} catch (e) {
			this.healthError = e instanceof Error ? e.message : String(e);
		} finally {
			this.healthLoading = false;
		}
	}

	async loadTables(): Promise<void> {
		this.tablesLoading = true;
		this.tablesError = null;
		try {
			this.tables = await libsqlListTables(this.activeDatabase);
		} catch (e) {
			this.tablesError = e instanceof Error ? e.message : String(e);
		} finally {
			this.tablesLoading = false;
		}
	}

	async executeQuery(): Promise<void> {
		const sql = this.queryInput.trim();
		if (!sql) return;

		this.queryLoading = true;
		this.queryError = null;
		this.queryResult = null;
		try {
			this.queryResult = await libsqlQuery(this.activeDatabase, sql);
			if (!this.queryHistory.includes(sql)) {
				this.queryHistory = [sql, ...this.queryHistory.slice(0, 19)];
			}
		} catch (e) {
			this.queryError = e instanceof Error ? e.message : String(e);
		} finally {
			this.queryLoading = false;
		}
	}

	setQueryFromHistory(q: string): void {
		this.queryInput = q;
	}

	clearResult(): void {
		this.queryResult = null;
		this.queryError = null;
	}
}

export const libsqlState = new LibSqlState();
