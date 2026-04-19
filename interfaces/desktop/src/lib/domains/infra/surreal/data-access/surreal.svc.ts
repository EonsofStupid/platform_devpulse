/**
 * @file SurrealDB Service — Tauri IPC wrappers.
 * @module @devpulse/domains/infra/surreal/data-access/surreal
 *
 * Thin wrappers over specta-generated `commands.*` calls.
 * Each function throws on error — callers decide how to handle.
 */

import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";
import type {
	GraphHealthAll,
	GraphKvEntry,
	GraphNamespace,
	GraphNamespaceStats,
	GraphPingResult,
	GraphTableInfo,
} from "../util/surreal.types.js";

// ── Health ──────────────────────────────────────────────────

/** Ping a single graph namespace. */
export async function pingGraph(namespace: GraphNamespace): Promise<GraphPingResult> {
	logInfo("surreal.svc", `pingGraph(${namespace})`);
	const result = await commands.pingGraph(namespace);
	if (result.status === "error") {
		logError("surreal.svc", `pingGraph(${namespace}) FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}

/** Ping all three namespaces + HTTP server check. */
export async function graphHealthAll(): Promise<GraphHealthAll> {
	logInfo("surreal.svc", "graphHealthAll()");
	const result = await commands.graphHealthAll();
	if (result.status === "error") {
		logError("surreal.svc", `graphHealthAll() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}

// ── Browser ─────────────────────────────────────────────────

/** List tables and record counts for a namespace. */
export async function graphListTables(namespace: GraphNamespace): Promise<GraphTableInfo[]> {
	logInfo("surreal.svc", `graphListTables(${namespace})`);
	const result = await commands.graphListTables(namespace);
	if (result.status === "error") {
		logError("surreal.svc", `graphListTables(${namespace}) FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	logInfo("surreal.svc", `graphListTables(${namespace}) ok — ${result.data.length} tables`);
	return result.data;
}

/** Get aggregate stats for a namespace. */
export async function graphStats(namespace: GraphNamespace): Promise<GraphNamespaceStats> {
	logInfo("surreal.svc", `graphStats(${namespace})`);
	const result = await commands.graphStats(namespace);
	if (result.status === "error") {
		logError("surreal.svc", `graphStats(${namespace}) FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}

// ── Console ─────────────────────────────────────────────────

/** Execute a raw SurrealQL query against a namespace. */
export async function graphQuery(namespace: GraphNamespace, query: string): Promise<unknown> {
	logInfo("surreal.svc", `graphQuery(${namespace}, ${query.slice(0, 60)}...)`);
	const result = await commands.graphQuery(namespace, query);
	if (result.status === "error") {
		logError("surreal.svc", `graphQuery() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}

// ── KV ──────────────────────────────────────────────────────

/** List all keys in the kv table for a namespace. */
export async function graphKvList(namespace: GraphNamespace): Promise<GraphKvEntry[]> {
	logInfo("surreal.svc", `graphKvList(${namespace})`);
	const result = await commands.graphKvList(namespace);
	if (result.status === "error") {
		logError("surreal.svc", `graphKvList(${namespace}) FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}
