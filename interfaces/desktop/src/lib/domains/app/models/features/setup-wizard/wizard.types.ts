/**
 * @file Wizard Types
 * @module @devpulse/domains/app/models/features/setup-wizard/types
 *
 * All types for the 8-phase dev onboarding wizard.
 * Follows the 10 Commandments spec — layman names, role colors, preset-first.
 */

import type { DevicePreference, HardwareTier, SlotId } from "../../types/models.types.js";

// ── Phases ─────────────────────────────────────────────

/** The 8 phases of dev onboarding, in order. */
export type WizardPhase =
	| "hardware"
	| "models"
	| "customize"
	| "browse"
	| "clyffy"
	| "project"
	| "completion";

/** All phases in order, for iteration. */
export const WIZARD_PHASES: WizardPhase[] = [
	"hardware",
	"models",
	"customize",
	"browse",
	"clyffy",
	"project",
	"completion",
];

/** Phase display metadata — layman labels. */
export interface PhaseInfo {
	phase: WizardPhase;
	label: string;
	description: string;
}

export const PHASE_INFO: PhaseInfo[] = [
	{
		phase: "hardware",
		label: "Your Hardware",
		description: "Detect CPU, GPU, memory, and storage",
	},
	{ phase: "models", label: "Set Up AI", description: "Download recommended AI models" },
	{ phase: "customize", label: "Customize", description: "Change individual model slots" },
	{ phase: "browse", label: "Find Models", description: "Browse local files or search online" },
	{ phase: "clyffy", label: "Test Chat", description: "Have a test conversation" },
	{ phase: "project", label: "About You", description: "Set up your developer profile" },
	{ phase: "completion", label: "Ready!", description: "Review and launch" },
];

/** Phases that appear in the progress dots (skip customize/browse — they're sub-pages). */
export const PROGRESS_PHASES: WizardPhase[] = [
	"hardware",
	"models",
	"clyffy",
	"project",
	"completion",
];

// ── Slot Labels (10 Commandments #3) ─────────────────

/** Layman-friendly slot metadata per the owner's spec. */
export interface SlotLabel {
	id: SlotId;
	name: string;
	description: string;
	role: SlotRole;
}

/** Role groupings for color coding (10 Commandments #4). */
export type SlotRole = "reasoning" | "observation" | "encoder" | "voice";

/** Role → CSS accent mapping. Uses --wiz-* local vars (wizard is ColdLight exception). */
export const ROLE_COLORS: Record<SlotRole, { accent: string; glow: string }> = {
	reasoning: { accent: "var(--wiz-role-brain)", glow: "var(--wiz-glow-purple)" },
	observation: { accent: "var(--wiz-role-minion)", glow: "var(--wiz-glow-green)" },
	encoder: { accent: "var(--wiz-role-encoder)", glow: "var(--wiz-glow-cyan)" },
	voice: { accent: "var(--wiz-role-voice)", glow: "var(--wiz-glow-ember)" },
};

/** The definitive slot label list. EXACT from owner's spec. */
export const SLOT_LABELS: SlotLabel[] = [
	{
		id: "chat.brain",
		name: "Clyffy's Brain",
		description: "thinks and writes code",
		role: "reasoning",
	},
	{
		id: "minion.shared",
		name: "Minion Core",
		description: "specialist helpers thinking about your project",
		role: "observation",
	},
	{
		id: "rag.embedder",
		name: "Memory Search",
		description: "finds relevant code",
		role: "encoder",
	},
	{
		id: "rag.reranker",
		name: "Quality Filter",
		description: "picks best results",
		role: "encoder",
	},
	{
		id: "vision.embedder",
		name: "Screen Reader",
		description: "understands screenshots",
		role: "encoder",
	},
	{ id: "voice.stt", name: "Voice Input", description: "Clyffy hears you", role: "voice" },
	{ id: "voice.tts", name: "Voice Output", description: "Clyffy talks back", role: "voice" },
];

/** Look up a slot label by ID. */
export function getSlotLabel(slotId: string): SlotLabel | undefined {
	return SLOT_LABELS.find((s) => s.id === slotId);
}

/** Get the layman name for a slot, falling back to the raw ID. */
export function friendlyName(slotId: string): string {
	return getSlotLabel(slotId)?.name ?? slotId;
}

// ── Allocation Mode (mirrors engine AllocationMode) ──

export type AllocationMode = "cpu_only" | "budget" | "standard" | "high" | "flagship";

export const ALLOCATION_MODES: AllocationMode[] = [
	"cpu_only",
	"budget",
	"standard",
	"high",
	"flagship",
];

export function tierToAllocation(tier: HardwareTier, vramTotalMb?: number): AllocationMode {
	switch (tier) {
		case "High":
			return "flagship";
		case "JessePrimary":
			return (vramTotalMb ?? 0) >= 16000 ? "flagship" : "high";
		case "Mid":
			return "high";
		case "Floor":
			return "standard";
		case "Minimal":
			return "budget";
		case "CpuOnly":
			return "cpu_only";
	}
}

export function allocationLabel(mode: AllocationMode): string {
	switch (mode) {
		case "cpu_only":
			return "CPU Only";
		case "budget":
			return "Budget (6 GB)";
		case "standard":
			return "Standard (8 GB)";
		case "high":
			return "High (12 GB)";
		case "flagship":
			return "Flagship (16 GB+)";
	}
}

// ── Model Recommendations ──────────────────────────────

/** Model recommendation for wizard download flow. */
export interface ModelRec {
	/** Human name: "Qwen3-8B" */
	name: string;
	/** Why the user needs it: "Your main AI brain" */
	purpose: string;
	/** Target slot ID. */
	slot: SlotId;
	/** Download size in MB */
	sizeMb: number;
	/** Estimated VRAM usage in MB (0 for CPU-only models) */
	vramMb: number;
	/** HuggingFace repo ID */
	repo: string;
	/** Filename within repo */
	file: string;
	/** Where this model runs */
	device: DevicePreference;
	/** Whether this model file is already downloaded on disk */
	alreadyDownloaded: boolean;
}

// ── Import ─────────────────────────────────────────────

export type ImportMode = "copy" | "symlink";

// ── Continue Gates ─────────────────────────────────────

export interface ContinueGate {
	phase: WizardPhase;
	conditions: string[];
	allMet: boolean;
	blockers: string[];
}

// ── Download Tracking ──────────────────────────────────

/** Tracked download in the download queue. */
export interface DownloadTracker {
	downloadId: string;
	slotId: SlotId;
	filename: string;
	friendlyName: string;
	bytesDownloaded: number;
	totalBytes: number;
	speedBps: number;
	status: "queued" | "downloading" | "complete" | "failed" | "cancelled";
	error?: string;
}

// ── Voice Config ───────────────────────────────────────

export type VoiceDeliveryMode = "stream" | "buffer" | "hybrid";

export interface VoiceConfig {
	latencyToleranceMs: number;
	deliveryMode: VoiceDeliveryMode;
}

// ── Escalation Config ─────────────────────────────────

export type EscalationSource = "local_slot" | "api";

export interface EscalationPriority {
	priority: number;
	source: EscalationSource;
	slotId?: SlotId;
	apiProvider?: "Anthropic" | "OpenAI";
	label: string;
}

export interface EscalationConfig {
	priorities: EscalationPriority[];
	detectionMode: "rule_based";
}

export const DEFAULT_ESCALATION: EscalationConfig = {
	priorities: [
		{ priority: 1, source: "local_slot", slotId: "voice.brain", label: "Voice Brain (CPU, fast)" },
		{
			priority: 2,
			source: "local_slot",
			slotId: "chat.brain",
			label: "Main Brain (GPU, full reasoning)",
		},
		{
			priority: 3,
			source: "api",
			apiProvider: "Anthropic",
			label: "Anthropic API (cloud fallback)",
		},
		{ priority: 4, source: "api", apiProvider: "OpenAI", label: "OpenAI API (cloud fallback)" },
	],
	detectionMode: "rule_based",
};

// ── Model Browser Filter ──────────────────────────────

export interface ModelBrowserFilter {
	format: "gguf" | "safetensors" | "all";
	maxSizeMb: number | null;
	fitOnly: boolean;
}
