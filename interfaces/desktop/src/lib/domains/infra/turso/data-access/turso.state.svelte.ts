/**
 * @file Turso State Rune — reactive state for devtools.
 * @module @devpulse/domains/infra/turso/data-access/turso.state
 */

import type {
	TursoDatabase,
	TursoHealthAll,
	TursoQueryResult,
	TursoTab,
	TursoTableInfo,
} from "../util/turso.types.js";
import { tursoHealthAll, tursoListTables, tursoQuery } from "./turso.service.js";

class TursoState {
	// ── Tab + namespace ─────────────────────────────────────
	activeTab = $state<TursoTab>("health");
	activeDatabase = $state<TursoDatabase>("System");

	// ── Health ──────────────────────────────────────────────
	health = $state<TursoHealthAll | null>(null);
	healthLoading = $state(false);
	healthError = $state<string | null>(null);

	// ── Tables ──────────────────────────────────────────────
	tables = $state<TursoTableInfo[]>([]);
	tablesLoading = $state(false);
	tablesError = $state<string | null>(null);

	// ── Console ─────────────────────────────────────────────
	queryInput = $state("");
	queryResult = $state<TursoQueryResult | null>(null);
	queryLoading = $state(false);
	queryError = $state<string | null>(null);
	queryHistory = $state<string[]>([]);

	// ── Derived ─────────────────────────────────────────────
	get reachableCount(): number {
		return this.health?.databases.filter((d) => d.reachable).length ?? 0;
	}

	// ── Actions ─────────────────────────────────────────────
	setTab(tab: TursoTab): void {
		this.activeTab = tab;
	}

	setDatabase(db: TursoDatabase): void {
		this.activeDatabase = db;
		this.tables = [];
		this.queryResult = null;
	}

	async loadHealth(): Promise<void> {
		this.healthLoading = true;
		this.healthError = null;
		try {
			this.health = await tursoHealthAll();
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
			this.tables = await tursoListTables(this.activeDatabase);
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
			this.queryResult = await tursoQuery(this.activeDatabase, sql);
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

export const tursoState = new TursoState();
