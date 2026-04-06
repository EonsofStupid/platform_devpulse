/**
 * @file Model Loader Types
 * @module @devpulse/domains/app/models/types
 *
 * Domain-only types for the model loader UI.
 * Wire types (SlotInfo, ModelInfo, HardwareInfo) come from specta bindings.
 * Re-exported here for convenience alongside domain helpers.
 */

// Re-export binding types as the canonical source
export type {
	HardwareInfo,
	ModelInfo,
	SlotInfo,
} from "$lib/sys/generated/bindings.js";

export type HardwareTier = "high" | "medium" | "low" | "minimal" | "cpu_only";

export type DevicePreference = "gpu" | "cpu" | "gpu_with_cpu_fallback" | "any";

// ── Slot Identity (SSOT: platform.default.toml) ───────

/** Canonical slot identifiers — matches platform.default.toml slot registry. */
export type SlotId =
	| "chat.brain"
	| "minion.shared"
	| "minion.escalation"
	| "rag.embedder"
	| "rag.reranker"
	| "vision.embedder"
	| "voice.stt"
	| "voice.tts"
	| "voice.brain";

/** All known slot IDs for iteration. */
export const SLOT_IDS: SlotId[] = [
	"chat.brain",
	"minion.shared",
	"minion.escalation",
	"rag.embedder",
	"rag.reranker",
	"vision.embedder",
	"voice.stt",
	"voice.tts",
	"voice.brain",
];

export type ModelCapability =
	| "text_generation"
	| "embedding"
	| "reranking"
	| "vision_language"
	| "vision_embedding"
	| "speech_to_text"
	| "text_to_speech";

// ── Loading ─────────────────────────────────────────────

export type LoadingStage =
	| "verifying"
	| "allocating"
	| "loading_weights"
	| "loading_tokenizer"
	| "warming_up"
	| "ready";

export interface MemoryFootprint {
	ramBytes: number;
	vramBytes: number;
}

/**
 * Frontend model status — superset of engine LoadingState (events.rs).
 *
 * Mapping from engine LoadingState:
 *   Cold    → { type: "cold" }         — on disk only
 *   Warm    → { type: "warm" }         — weights cached, fast reload
 *   Standby → { type: "standby" }      — session created, <500ms activation
 *   Hot     → { type: "hot" }          — active on GPU/CPU, inference-ready
 *
 * Frontend-only transient states:
 *   loading   → transitioning between states
 *   failed    → transition failed with error
 *   unloading → being removed from memory
 */
export type ModelStatus =
	| { type: "cold" }
	| { type: "warm" }
	| { type: "standby" }
	| { type: "hot"; footprint: MemoryFootprint }
	| { type: "loading"; stage: LoadingStage; progressPct: number }
	| { type: "failed"; error: string }
	| { type: "unloading" };

export interface SlotStatus {
	slotId: SlotId;
	modelStatus: ModelStatus;
	activeFallback: SlotId | null;
	sharedWith: SlotId[];
}

// ── VRAM Budget ─────────────────────────────────────────

export type BudgetStatus = "hot" | "planned" | "wont_fit" | "unassigned" | "shared_instance";

export interface SlotBudgetEntry {
	slotId: string;
	modelName: string;
	vramEstimateMb: number;
	status: BudgetStatus;
	sharedWith: string[];
}

export interface VramBudget {
	totalVramMb: number;
	currentlyUsedMb: number;
	plannedLoadMb: number;
	remainingAfterPlanMb: number;
	perSlot: SlotBudgetEntry[];
}

// ── Auto Config ─────────────────────────────────────────

export interface SlotRecommendation {
	slotId: string;
	modelRepoId: string;
	modelFilename: string;
	modelSizeMb: number;
	vramEstimateMb: number;
	alreadyDownloaded: boolean;
	device: DevicePreference;
}

export interface AutoConfig {
	tier: HardwareTier;
	recommendations: SlotRecommendation[];
	totalVramNeededMb: number;
	totalDownloadSizeMb: number;
}

// ── Download ────────────────────────────────────────────

export interface DownloadProgress {
	downloadId: string;
	bytesDownloaded: number;
	totalBytes: number;
	speedBps: number;
	etaSecs: number;
}

// ── UI Helpers ──────────────────────────────────────────

/** Color indicator for model VRAM fit against current hardware */
export type FitIndicator = "green" | "yellow" | "red" | "gray";

/** Calculate fit indicator for a model against current free VRAM */
export function calculateFit(
	vramEstimateMb: number,
	freeVramMb: number | null,
	totalVramMb: number | null,
): FitIndicator {
	if (freeVramMb === null || totalVramMb === null) return "gray"; // no GPU
	if (vramEstimateMb > freeVramMb) return "red"; // won't fit
	const remainingAfter = freeVramMb - vramEstimateMb;
	const remainingPercent = (remainingAfter / totalVramMb) * 100;
	if (remainingPercent < 20) return "yellow"; // tight
	return "green"; // comfortable
}

/** Format bytes to human-readable size */
export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Format MB to human-readable */
export function formatMb(mb: number): string {
	if (mb < 1024) return `${mb} MB`;
	return `${(mb / 1024).toFixed(1)} GB`;
}

/** Friendly slot label for layman mode */
export function friendlySlotLabel(slotId: SlotId | string): string {
	const map: Record<string, string> = {
		"chat.brain": "AI Brain",
		"minion.shared": "Quick Worker",
		"minion.escalation": "Deep Thinker",
		"rag.embedder": "Search Engine",
		"rag.reranker": "Relevance Scorer",
		"vision.embedder": "Vision",
		"voice.tts": "Clyffy's Voice",
		"voice.stt": "Voice Input",
		"voice.brain": "Voice Conversation",
	};
	return map[slotId] ?? slotId;
}

/** One-line layman description of what the slot does */
export function slotDescription(slotId: SlotId | string): string {
	const map: Record<string, string> = {
		"chat.brain": "Talks to you, writes code, answers questions",
		"minion.shared": "Fast background tasks — summarizing, formatting",
		"minion.escalation": "Complex analysis when the main AI needs help",
		"rag.embedder": "Finds relevant code and docs for context",
		"rag.reranker": "Ranks search results by relevance",
		"vision.embedder": "Understands screenshots and diagrams",
		"voice.tts": "Speaks AI responses out loud",
		"voice.stt": "Converts your speech to text",
		"voice.brain": "Quick conversational responses for voice chat",
	};
	return map[slotId] ?? "";
}

/** Friendly slot purpose for Clyffy narration */
export function friendlySlotPurpose(slotId: SlotId | string): string {
	const map: Record<string, string> = {
		"chat.brain": "the heavy thinking",
		"minion.shared": "quick background tasks",
		"minion.escalation": "deep analysis",
		"rag.embedder": "finding relevant code",
		"rag.reranker": "ranking search results",
		"vision.embedder": "understanding screenshots",
		"voice.tts": "speaking to you",
		"voice.stt": "listening to your voice",
		"voice.brain": "desk conversation",
	};
	return map[slotId] ?? "its job";
}

/** CSS color for fit indicator */
export function fitColor(fit: FitIndicator): string {
	switch (fit) {
		case "green":
			return "oklch(0.75 0.18 155)";
		case "yellow":
			return "oklch(0.82 0.16 85)";
		case "red":
			return "oklch(0.65 0.22 25)";
		case "gray":
			return "oklch(0.55 0.02 260)";
	}
}

/** Status label for slot display — covers all 7 ModelStatus variants. */
export function statusLabel(status: ModelStatus): string {
	switch (status.type) {
		case "cold":
			return "Not Loaded";
		case "warm":
			return "Cached";
		case "standby":
			return "Ready";
		case "hot":
			return "Active";
		case "loading":
			return `Loading ${Math.round(status.progressPct)}%`;
		case "failed":
			return "Failed";
		case "unloading":
			return "Unloading";
	}
}

/** Status color for slot display — uses signal CSS vars. */
export function statusColor(status: ModelStatus): string {
	switch (status.type) {
		case "hot":
			return "var(--signal-success)";
		case "standby":
			return "var(--signal-success)";
		case "warm":
			return "var(--accent-teal-main)";
		case "loading":
			return "var(--signal-warning)";
		case "failed":
			return "var(--signal-error)";
		case "cold":
		case "unloading":
			return "var(--text-muted)";
	}
}

/** Whether a model status means the slot can serve inference. */
export function isInferenceReady(status: ModelStatus): boolean {
	return status.type === "hot" || status.type === "standby";
}

/** Format bytes-per-second to human-readable download speed */
export function formatSpeed(bps: number): string {
	if (bps < 1024) return `${bps} B/s`;
	if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(0)} KB/s`;
	return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`;
}

/** Format seconds to human-readable ETA */
export function formatEta(seconds: number): string {
	if (seconds < 0 || !Number.isFinite(seconds)) return "calculating...";
	if (seconds < 60) return `${Math.ceil(seconds)}s`;
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s`;
	return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

/** Format context length to readable form */
export function formatContext(tokens: number): string {
	if (tokens <= 0) return "unknown";
	if (tokens < 1024) return `${tokens} tokens`;
	return `${(tokens / 1024).toFixed(0)}K context`;
}

/** Fit label for layman display */
export function fitLabel(fit: FitIndicator): string {
	switch (fit) {
		case "green":
			return "fits comfortably";
		case "yellow":
			return "tight fit";
		case "red":
			return "won't fit — will use CPU";
		case "gray":
			return "no GPU detected";
	}
}
