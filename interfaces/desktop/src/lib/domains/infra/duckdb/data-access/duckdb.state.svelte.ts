/**
 * @file DuckDB State Rune — reactive state for devtools.
 * @module @devpulse/domains/infra/duckdb/data-access/duckdb.state
 */

import type {
	DuckDbHealth,
	DuckDbQueryResult,
	DuckDbTab,
	DuckDbTableInfo,
} from "../util/duckdb.types.js";
import { duckdbHealth, duckdbListTables, duckdbQuery } from "./duckdb.svc.js";

class DuckDbState {
	// ── Tab ──────────────────────────────────────────────────
	activeTab = $state<DuckDbTab>("health");

	// ── Health ──────────────────────────────────────────────
	health = $state<DuckDbHealth | null>(null);
	healthLoading = $state(false);
	healthError = $state<string | null>(null);
	/** Completed health checks — drives the status card's activity pulse. */
	healthChecks = $state(0);

	// ── Tables ──────────────────────────────────────────────
	tables = $state<DuckDbTableInfo[]>([]);
	tablesLoading = $state(false);
	tablesError = $state<string | null>(null);

	// ── Console ─────────────────────────────────────────────
	queryInput = $state("");
	queryResult = $state<DuckDbQueryResult | null>(null);
	queryLoading = $state(false);
	queryError = $state<string | null>(null);
	queryHistory = $state<string[]>([]);

	// ── Actions ─────────────────────────────────────────────
	setTab(tab: DuckDbTab): void {
		this.activeTab = tab;
	}

	async loadHealth(): Promise<void> {
		this.healthLoading = true;
		this.healthError = null;
		try {
			this.health = await duckdbHealth();
			this.healthChecks += 1;
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
			this.tables = await duckdbListTables();
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
			this.queryResult = await duckdbQuery(sql);
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

export const duckdbState = new DuckDbState();
