/**
 * @file Search Service
 * @module @devpulse/domains/app/models/services/search
 *
 * HuggingFace model search.
 * HARD FAIL — no mock data. Errors surface to UI.
 */

import { invoke } from "@tauri-apps/api/core";
import { logError, logInfo } from "$lib/sys/logger.js";

export interface HfSearchResult {
	repoId: string;
	author: string;
	modelName: string;
	downloads: number;
	likes: number;
	pipelineTag: string | null;
	tags: string[];
	ggufFiles: HfFileInfo[];
	lastModified: string;
}

export interface HfFileInfo {
	filename: string;
	sizeBytes: number;
	quantLevel: string | null;
}

/** Search HuggingFace for GGUF models. */
export async function searchHuggingFace(
	query: string,
	limit: number = 20,
): Promise<HfSearchResult[]> {
	logInfo("models.search", `Searching HF: "${query}" (limit ${limit})`);
	try {
		const results = await invoke<HfSearchResult[]>("search_huggingface", { query, limit });
		logInfo("models.search", `Found ${results.length} results`);
		return results;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.search", `Search FAILED: ${msg}`);
		throw new Error(`Search failed: ${msg}`);
	}
}
