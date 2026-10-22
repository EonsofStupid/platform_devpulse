/**
 * @file Catalog service — fetches model download catalog from Rust config.
 * @module @devpulse/domains/app/models/data-access/catalog
 *
 * Single source of truth: repo-root platform TOML fragments -> composed engine config -> Tauri -> here.
 * No hardcoded model repos in frontend code.
 */

import type { CatalogEntry } from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";

/** Cached catalog entries. */
let catalogCache: CatalogEntry[] | null = null;

/** Fetch the model catalog from Rust. Caches after first call. */
export async function getCatalog(): Promise<CatalogEntry[]> {
	if (catalogCache) return catalogCache;
	const result = await commands.getModelCatalog();
	if (result.status === "ok") {
		catalogCache = result.data;
		return result.data;
	}
	console.error("[catalog] Failed to fetch catalog:", result.error);
	return [];
}

/** Force refresh the catalog cache (e.g. after config change). */
export async function refreshCatalog(): Promise<CatalogEntry[]> {
	catalogCache = null;
	return getCatalog();
}

/** Get catalog entry for a specific slot ID. */
export async function getCatalogForSlot(slotId: string): Promise<CatalogEntry | null> {
	const catalog = await getCatalog();
	return catalog.find((entry) => entry.slot_id === slotId) ?? null;
}
