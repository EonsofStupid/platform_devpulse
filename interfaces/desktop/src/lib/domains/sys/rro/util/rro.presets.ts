/**
 * @file RRO Preset Definitions
 * @module @devpulse/domains/sys/rro/util
 *
 * Named baseline presets. Values research-validated against
 * nomic-embed-text-v1.5 (768-dim, cosine) + Qwen3-Reranker-0.6B
 * (cross-encoder, evaluated on top-100 candidates).
 *
 * Rationale per preset:
 *   conservative  — High precision, fewer results. Safer recall floor.
 *   balanced      — Matches Qwen3 eval baseline (top-100). Default.
 *   aggressive    — Max recall, broad matches. Use when evaluating new stores.
 *   precision     — Tightest filter, consensus-heavy. Use for high-stakes queries.
 */

import type { PresetName, RetrievalConfig } from "./rro.types.js";

export interface PresetDefinition {
	name: PresetName;
	label: string;
	description: string;
	config: RetrievalConfig;
}

export const RRO_PRESETS: readonly PresetDefinition[] = [
	{
		name: "conservative",
		label: "Focused",
		description: "Fewer, higher-quality results",
		config: {
			preset: "conservative",
			top_k: 50,
			score_threshold: 0.7,
			rerank_top_n: 5,
			fusion_k: 40,
		},
	},
	{
		name: "balanced",
		label: "Balanced",
		description: "Default — good for most queries",
		config: {
			preset: "balanced",
			top_k: 100,
			score_threshold: 0.5,
			rerank_top_n: 10,
			fusion_k: 30,
		},
	},
	{
		name: "aggressive",
		label: "Wide",
		description: "More results, broader matches",
		config: {
			preset: "aggressive",
			top_k: 200,
			score_threshold: 0.3,
			rerank_top_n: 20,
			fusion_k: 20,
		},
	},
	{
		name: "precision",
		label: "Precise",
		description: "Tightest filter, few results",
		config: {
			preset: "precision",
			top_k: 50,
			score_threshold: 0.8,
			rerank_top_n: 3,
			fusion_k: 50,
		},
	},
] as const;

/** Resolve a preset name into its config. Returns null for "custom" or unknown. */
export function getPreset(name: string): RetrievalConfig | null {
	const def = RRO_PRESETS.find((p) => p.name === name);
	return def ? { ...def.config } : null;
}
