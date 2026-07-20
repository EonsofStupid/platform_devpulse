/**
 * @file anatomy.types.ts
 * @module @devpulse/devtools/runtimes/orchestrator/slots/util/anatomy
 *
 * Types for the cortex anatomy constellation that sits in the
 * SlotsDevtool Status tab. Each anatomy tile (Brain / Sparkles /
 * Eyes / Ears / Mouth) maps to one engine slot id and renders a
 * customer-facing slot save card.
 *
 * Extracted from `feature/setup-wizard/util/wizard.types.ts` as the
 * wizard surface is absorbed into the SlotsDevtool. The fields
 * unrelated to the anatomy tile + save chain (callbacks, multi-step
 * wizard nav) intentionally do not move — they have no consumer in
 * the devtool surface.
 */

/**
 * One row of the engine's `AutoConfig.recommendations` JSON. Mirrors
 * `SlotRecommendation` in the engine's `platform/hardware/auto_config.rs`.
 *
 * `already_downloaded` lets progress UIs show the right total instead
 * of pretending nothing is queued when every recommended file is on
 * disk (the chain still runs as download→scan→assign→load with
 * download being a no-op via HF cache).
 */
export interface SlotRecommendation {
	slot_id: string;
	model_repo_id: string;
	model_filename: string;
	model_size_mb: number;
	vram_estimate_mb: number;
	already_downloaded: boolean;
	device: string;
	/** Optional customer-facing model label set by the preset author
	 *  (`display_name` in the engine's `config/presets.default.toml`).
	 *  Absent → wizard derives a label from `model_repo_id`. */
	display_name?: string | null;
	/** Optional one-line layman tagline set by the preset author.
	 *  Absent → wizard derives an engine-aware fallback from
	 *  `model_filename` (e.g. ".gguf" → "Runs through llama.cpp"). */
	display_tagline?: string | null;
}

/**
 * Lifecycle of a per-slot save. `ready` = nothing dispatched yet;
 * `saving` = `installToSlot` in flight (paired slots dispatch in
 * parallel — see `data-access/slot-anatomy.ts.PAIRED_SLOTS`);
 * `saved` = every paired install reported `complete`; `error` = at
 * least one paired install reported `failed` or the dispatch RPC
 * itself rejected.
 */
export type SlotSaveLifecycle = "ready" | "saving" | "saved" | "error";

/**
 * Per-tile entry the cortex constellation renders. One per anatomy
 * tile that has an engine recommendation today; the SLOT_LAYMAN table
 * in `data-access/slot-anatomy.ts` drives which slots qualify.
 */
export interface SlotSaveEntry {
	/** Stable engine slot id — matches `SlotRecommendation.slot_id`. */
	kernelSlotId: string;
	/** Layman slot purpose ("Eyes · what Clyffy sees"). */
	purpose: string;
	/** Role description for the slot. */
	tagline: string;
	/** Layman model name ("SigLIP HD"). */
	modelName: string;
	/** Short model tagline. */
	modelTagline: string;
	/** Pre-formatted size hint ("~400 MB"). */
	sizeHint: string;
	/** Optional tier badge label. */
	tierLabel?: string;
	/** Lifecycle of the save. */
	state: SlotSaveLifecycle;
	/** Error message when `state === "error"`. */
	errorText?: string;
	/** Optional info-link href. */
	aboutHref?: string;
	/** Lucide-svelte icon name. The cortex view resolves it to a
	 *  component via its `ICON_MAP`. Anatomy mapping: Eye = vision
	 *  encoder, Ear = STT, Mic = TTS, Sparkles = minion / rag encoder,
	 *  BrainCircuit = deep reasoning. */
	iconName: "Eye" | "Ear" | "Mic" | "Sparkles" | "BrainCircuit";
	/** CSS variable name for the per-slot accent. Must resolve to a
	 *  generated `--accent-*-main` token in
	 *  `lib/design/manifest/token-manifest.json`. */
	accentVar: string;
}
