/**
 * @file RRO Vector Service — Tauri IPC wrappers for vector store.
 * @module @devpulse/domains/sys/rro/data-access
 *
 * All vector-store IPC lives here. Each function:
 *  - throws on error (callers decide how to handle)
 *  - is named after the operation, not the Tauri command
 *  - composes with withAction() + withRetry() from $lib/sys
 *  - emits traces via rro.trace
 *
 * NEVER import feature/ or ui/. NEVER reach into $lib/domains/*.
 */

import { commands } from "$lib/sys/generated/bindings.js";
import { withRetry } from "$lib/sys/retry.js";
import type {
	RetrievalConfig,
	RetrievalParamMeta,
	VectorHealthReport,
	VectorSearchResult,
} from "../util/rro.types.js";
import { trace } from "./rro.trace.js";

// ── Config ──────────────────────────────────────────────────

/** Fetch current retrieval config (idempotent — retried). */
export async function getRetrievalConfig(): Promise<RetrievalConfig> {
	return trace("tuning", "getRetrievalConfig", () =>
		withRetry(
			async () => {
				const r = await commands.getVectorConfig();
				if (r.status === "error") throw new Error(r.error);
				return r.data;
			},
			{ label: "rro.getRetrievalConfig" },
		),
	);
}

/** Update retrieval config (mutation — no retry). */
export async function setRetrievalConfig(config: RetrievalConfig): Promise<void> {
	return trace("tuning", "setRetrievalConfig", async () => {
		const r = await commands.setVectorConfig(config);
		if (r.status === "error") throw new Error(r.error);
	});
}

/** Fetch layman-labeled parameter registry (idempotent — retried). */
export async function getParamMeta(): Promise<RetrievalParamMeta[]> {
	return trace("tuning", "getParamMeta", () =>
		withRetry(
			async () => {
				const r = await commands.getRetrievalParamMeta();
				if (r.status === "error") throw new Error(r.error);
				return r.data;
			},
			{ label: "rro.getParamMeta" },
		),
	);
}

// ── Health / collections ────────────────────────────────────

/** Full health report — storage path + all collections with point counts. */
export async function getVectorHealth(): Promise<VectorHealthReport> {
	return trace("collections", "getVectorHealth", () =>
		withRetry(
			async () => {
				const r = await commands.getVectorHealth();
				if (r.status === "error") throw new Error(r.error);
				return r.data;
			},
			{ label: "rro.getVectorHealth" },
		),
	);
}

/** Create a named collection (mutation — no retry). */
export async function createCollection(name: string, dimension: number): Promise<void> {
	return trace("collections", `createCollection(${name})`, async () => {
		const r = await commands.createVectorCollection(name, dimension);
		if (r.status === "error") throw new Error(r.error);
	});
}

/** Delete a collection by name (mutation — no retry). */
export async function deleteCollection(name: string): Promise<void> {
	return trace("collections", `deleteCollection(${name})`, async () => {
		const r = await commands.deleteVectorCollection(name);
		if (r.status === "error") throw new Error(r.error);
	});
}

// ── Search ──────────────────────────────────────────────────

/** Run a raw-vector search against a collection. */
export async function testSearch(
	collection: string,
	vector: number[],
	limit: number,
): Promise<VectorSearchResult[]> {
	return trace("search", `testSearch(${collection}, limit=${limit})`, async () => {
		const r = await commands.vectorTestSearch(collection, vector, limit);
		if (r.status === "error") throw new Error(r.error);
		return r.data;
	});
}
