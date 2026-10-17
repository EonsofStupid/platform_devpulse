/**
 * @file SurrealDB State Rune
 * @module @devpulse/domains/infra/surreal/data-access/surreal
 *
 * Reactive state for the SurrealDB devtool. Manages health,
 * table browsing, and SurrealQL console. All data fetched via IPC on demand.
 */

import { logError } from "$lib/sys/logger.js";
import type {
	GraphHealthAll,
	GraphKvEntry,
	GraphNamespace,
	GraphNamespaceStats,
	GraphTableInfo,
	SurrealTab,
} from "../util/surreal.types.js";
import {
	graphHealthAll,
	graphKvList,
	graphListTables,
	graphQuery,
	graphStats,
} from "./surreal.svc.js";

class SurrealState {
	// ── Tab navigation ──────────────────────────────────────
	activeTab = $state<SurrealTab>("health");

	// ── Active namespace selector ───────────────────────────
	activeNamespace = $state<GraphNamespace>("System");

	// ── Health ──────────────────────────────────────────────
	health = $state<GraphHealthAll | null>(null);
	healthLoading = $state(false);
	healthError = $state<string | null>(null);
	/** Completed health checks — drives the status card's activity pulse. */
	healthChecks = $state(0);

	// ── Browser ─────────────────────────────────────────────
	tables = $state<GraphTableInfo[]>([]);
	stats = $state<GraphNamespaceStats | null>(null);
	kvEntries = $state<GraphKvEntry[]>([]);
	browserLoading = $state(false);
	browserError = $state<string | null>(null);

	// ── Console ─────────────────────────────────────────────
	queryInput = $state("");
	queryResult = $state<unknown>(null);
	queryError = $state<string | null>(null);
	queryLoading = $state(false);
	queryHistory = $state<string[]>([]);

	// ── Derived ─────────────────────────────────────────────

	get allReachable(): boolean {
		if (!this.health) return false;
		return this.health.namespaces.every((ns) => ns.reachable);
	}

	get reachableCount(): number {
		if (!this.health) return 0;
		return this.health.namespaces.filter((ns) => ns.reachable).length;
	}

	// ── Health actions ──────────────────────────────────────

	async loadHealth(): Promise<void> {
		if (this.healthLoading) return;
		this.healthLoading = true;
		this.healthError = null;
		try {
			this.health = await graphHealthAll();
			this.healthChecks += 1;
		} catch (e) {
			this.healthError = e instanceof Error ? e.message : String(e);
			logError("surreal", `loadHealth() FAILED: ${this.healthError}`);
		} finally {
			this.healthLoading = false;
		}
	}

	// ── Browser actions ─────────────────────────────────────

	async loadTables(): Promise<void> {
		if (this.browserLoading) return;
		this.browserLoading = true;
		this.browserError = null;
		try {
			const [tableList, nsStats, kv] = await Promise.all([
				graphListTables(this.activeNamespace),
				graphStats(this.activeNamespace),
				graphKvList(this.activeNamespace),
			]);
			this.tables = tableList;
			this.stats = nsStats;
			this.kvEntries = kv;
		} catch (e) {
			this.browserError = e instanceof Error ? e.message : String(e);
			logError("surreal", `loadTables() FAILED: ${this.browserError}`);
		} finally {
			this.browserLoading = false;
		}
	}

	// ── Console actions ─────────────────────────────────────

	async executeQuery(): Promise<void> {
		const q = this.queryInput.trim();
		if (!q || this.queryLoading) return;
		this.queryLoading = true;
		this.queryError = null;
		this.queryResult = null;
		try {
			this.queryResult = await graphQuery(this.activeNamespace, q);
			// Add to history (dedup, max 20)
			this.queryHistory = [q, ...this.queryHistory.filter((h) => h !== q)].slice(0, 20);
		} catch (e) {
			this.queryError = e instanceof Error ? e.message : String(e);
			logError("surreal", `executeQuery() FAILED: ${this.queryError}`);
		} finally {
			this.queryLoading = false;
		}
	}

	setQueryFromHistory(query: string): void {
		this.queryInput = query;
	}

	clearResult(): void {
		this.queryResult = null;
		this.queryError = null;
	}

	// ── Navigation ──────────────────────────────────────────

	setTab(tab: SurrealTab): void {
		this.activeTab = tab;
	}

	setNamespace(ns: GraphNamespace): void {
		this.activeNamespace = ns;
		// Clear browser data when switching namespace
		this.tables = [];
		this.stats = null;
		this.kvEntries = [];
		this.browserError = null;
	}
}

export const surrealState = new SurrealState();
