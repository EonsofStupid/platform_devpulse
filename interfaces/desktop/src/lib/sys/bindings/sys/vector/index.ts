/**
 * @file sys/bindings/sys/vector/index.ts
 * @description Vector store (RRO retrieval) — config, health, collections.
 */

import { commands } from "#lib/sys/generated/bindings.js";

export const getVectorConfig = commands.getVectorConfig;
export const setVectorConfig = commands.setVectorConfig;
export const getVectorHealth = commands.getVectorHealth;
export const vectorTestSearch = commands.vectorTestSearch;
export const createVectorCollection = commands.createVectorCollection;
export const deleteVectorCollection = commands.deleteVectorCollection;
export const getRetrievalParamMeta = commands.getRetrievalParamMeta;

export type {
	CollectionInfo,
	RetrievalConfig,
	RetrievalParamMeta,
	VectorHealthReport,
	VectorSearchResult,
} from "#lib/sys/generated/bindings.js";
