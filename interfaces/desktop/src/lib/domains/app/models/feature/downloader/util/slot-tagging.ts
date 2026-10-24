/**
 * @file Slot-tagging heuristics — infer plausible slot targets for an HF result.
 * @module @devpulse/domains/app/models/feature/downloader/util/slot-tagging
 *
 * The downloader's search panel needs to suggest "this is probably an
 * embedder" / "this is probably a brain" so the user doesn't have to
 * read every README. The heuristics below match against the lowercased
 * repo id, then return the slot ids in confidence order so the dropdown
 * defaults to the most likely role.
 *
 * NOT a replacement for `recommend_primary_for_slot` on the kernel side
 * — that's the authoritative capability check at install time. These
 * tags are purely a UI affordance to skip the "what is this?" friction.
 */

import type { HfSearchResultInfo } from "$lib/sys/generated/bindings.js";
import type { SuggestedSlotTag, TagConfidence } from "./downloader.types.js";

interface Heuristic {
	pattern: RegExp;
	slotId: string;
	confidence: TagConfidence;
	reason: string;
}

/**
 * Ordered list — patterns are lowercase-matched against the repo id
 * (`<owner>/<name>`). The first heuristic that fires per slot id wins;
 * subsequent matches for the same slot are skipped so each slot appears
 * at most once in the result.
 *
 * Pattern authoring rules:
 *   - Lowercase only — the haystack is lowercased before matching.
 *   - Prefer specific markers (`harrier`, `bge-reranker`) over generic
 *     ones (`-instruct`) so the specific match runs first.
 *   - Reason text is rendered into a tooltip + aria-description; keep
 *     it under ~70 characters.
 */
const HEURISTICS: readonly Heuristic[] = [
	// ── Embedders ───────────────────────────────────────────────────
	{
		pattern: /harrier/,
		slotId: "rag.embedder",
		confidence: "exact",
		reason: "Harrier is the default embedder in every shipped preset",
	},
	{
		pattern: /bge-reranker/,
		slotId: "rag.reranker",
		confidence: "exact",
		reason: "BGE reranker series",
	},
	{
		pattern: /bge-/,
		slotId: "rag.embedder",
		confidence: "high",
		reason: "BGE family — sentence-transformer embeddings",
	},
	{
		pattern: /e5-/,
		slotId: "rag.embedder",
		confidence: "high",
		reason: "E5 family — text embeddings",
	},
	{
		pattern: /gte-/,
		slotId: "rag.embedder",
		confidence: "medium",
		reason: "GTE family — general text embeddings",
	},
	{
		pattern: /embed/,
		slotId: "rag.embedder",
		confidence: "medium",
		reason: "Repo name names this an embedder",
	},
	// ── Rerankers ───────────────────────────────────────────────────
	{
		pattern: /rerank/,
		slotId: "rag.reranker",
		confidence: "high",
		reason: "Repo name names this a reranker",
	},
	// ── Vision ──────────────────────────────────────────────────────
	{
		pattern: /siglip/,
		slotId: "vision.embedder",
		confidence: "high",
		reason: "SigLIP vision encoder",
	},
	{
		pattern: /\bclip\b|openclip/,
		slotId: "vision.embedder",
		confidence: "medium",
		reason: "CLIP-family vision encoder",
	},
	// ── Voice ───────────────────────────────────────────────────────
	{
		pattern: /whisper/,
		slotId: "voice.stt",
		confidence: "high",
		reason: "Whisper — speech-to-text",
	},
	{
		pattern: /kokoro/,
		slotId: "voice.tts",
		confidence: "high",
		reason: "Kokoro — text-to-speech",
	},
	{
		pattern: /-stt\b|speech-to-text/,
		slotId: "voice.stt",
		confidence: "medium",
		reason: "Repo names this as speech-to-text",
	},
	{
		pattern: /-tts\b|text-to-speech/,
		slotId: "voice.tts",
		confidence: "medium",
		reason: "Repo names this as text-to-speech",
	},
	// ── Brain (vision-language) ─────────────────────────────────────
	{
		pattern: /qwen3-vl|qwen2-vl/,
		slotId: "chat.vision",
		confidence: "high",
		reason: "Qwen-VL — vision-language brain",
	},
	{
		pattern: /phi-4.*vision|phi4-mm|phi-4-multimodal/,
		slotId: "chat.vision",
		confidence: "high",
		reason: "Phi-4 multimodal — vision-language brain",
	},
	// ── Brain (text-only large language models) ─────────────────────
	{
		pattern: /qwen3/,
		slotId: "chat.brain",
		confidence: "medium",
		reason: "Qwen3 — general-purpose reasoning brain",
	},
	{
		pattern: /phi-4|phi4-reasoning/,
		slotId: "chat.brain",
		confidence: "medium",
		reason: "Phi-4 — reasoning brain",
	},
	{
		pattern: /nemotron/,
		slotId: "chat.brain",
		confidence: "medium",
		reason: "Nemotron — reasoning brain",
	},
	{
		pattern: /-instruct\b/,
		slotId: "chat.brain",
		confidence: "low",
		reason: "Instruction-tuned LLM",
	},
	{
		pattern: /-chat\b/,
		slotId: "chat.brain",
		confidence: "low",
		reason: "Chat-tuned LLM",
	},
];

const CONFIDENCE_RANK: Record<TagConfidence, number> = {
	exact: 3,
	high: 2,
	medium: 1,
	low: 0,
};

/**
 * Suggest slot tags for an HF search result. Returns an ordered list of
 * unique `SuggestedSlotTag` entries — highest confidence first, each
 * slot id appearing at most once. Empty when no heuristic matches; the
 * UI should then offer the user the full slot list to pick from.
 */
export function suggestSlots(result: HfSearchResultInfo): SuggestedSlotTag[] {
	const haystack = (result.repo_id ?? "").toLowerCase();
	if (haystack.length === 0) return [];

	const seen = new Set<string>();
	const out: SuggestedSlotTag[] = [];

	for (const heuristic of HEURISTICS) {
		if (seen.has(heuristic.slotId)) continue;
		if (!heuristic.pattern.test(haystack)) continue;
		seen.add(heuristic.slotId);
		out.push({
			slotId: heuristic.slotId,
			confidence: heuristic.confidence,
			reason: heuristic.reason,
		});
	}

	out.sort((a, b) => CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence]);
	return out;
}

/** Best single tag, or `null` when no heuristic fires. */
export function topSuggestion(result: HfSearchResultInfo): SuggestedSlotTag | null {
	const all = suggestSlots(result);
	return all[0] ?? null;
}
