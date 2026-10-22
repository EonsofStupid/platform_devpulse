/**
 * @file Search Service
 * @module @devpulse/domains/app/models/data-access/search
 *
 * HuggingFace model search via specta-generated bindings.
 * HARD FAIL — no mock data. Errors surface to UI.
 */

import { commands, type HfSearchResultInfo } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";

export type { HfFileInfoItem, HfSearchResultInfo } from "$lib/sys/generated/bindings.js";

/** Search HuggingFace for GGUF models. */
export async function searchHuggingFace(
	query: string,
	limit: number = 20,
): Promise<HfSearchResultInfo[]> {
	logInfo("models.search", `Searching HF: "${query}" (limit ${limit})`);
	try {
		const result = await commands.searchHuggingface(query, limit);
		if (result.status === "error") {
			throw new Error(result.error);
		}
		logInfo("models.search", `Found ${result.data.length} results`);
		return result.data;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.search", `Search FAILED: ${msg}`);
		throw new Error(`Search failed: ${msg}`);
	}
}
