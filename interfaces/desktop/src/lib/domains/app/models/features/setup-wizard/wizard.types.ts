/**
 * @file Wizard Types
 * @module @devpulse/domains/app/models/features/setup-wizard/types
 *
 * All types for the 5-phase dev onboarding wizard.
 * Does NOT duplicate types from models.types.ts — imports them.
 */

import type { DevicePreference, HardwareTier } from "../../types/models.types.js";

// ── Phases ─────────────────────────────────────────────

/** The 5 phases of dev onboarding, in order. */
export type WizardPhase = "hardware" | "models" | "voice" | "clyffy" | "project";

/** All phases in order, for iteration. */
export const WIZARD_PHASES: WizardPhase[] = ["hardware", "models", "voice", "clyffy", "project"];

/** Phase display metadata. */
export interface PhaseInfo {
	phase: WizardPhase;
	label: string;
	description: string;
}

export const PHASE_INFO: PhaseInfo[] = [
	{ phase: "hardware", label: "Hardware", description: "Detect CPU, GPU, VRAM, disk" },
	{ phase: "models", label: "Models", description: "Download and assign AI models" },
	{ phase: "voice", label: "Voice", description: "Configure speech-to-text and text-to-speech" },
	{ phase: "clyffy", label: "Clyffy", description: "First conversation and pipeline test" },
	{ phase: "project", label: "Project", description: "Set up dev profile and index code" },
];

// ── Hardware Profiles ──────────────────────────────────

/** Hardware profile tiers from the spec — maps to curated recommendations. */
export type HardwareProfile =
	| "ENTRY_8GB"
	| "MID_12GB"
	| "HIGH_16GB"
	| "ENTHUSIAST_24GB"
	| "CPU_ONLY";

/** Map HardwareTier (from models.types) to HardwareProfile (wizard-specific). */
export function tierToProfile(tier: HardwareTier): HardwareProfile {
	switch (tier) {
		case "high":
			return "ENTHUSIAST_24GB";
		case "medium":
			return "ENTRY_8GB";
		case "low":
			return "ENTRY_8GB";
		case "minimal":
			return "CPU_ONLY";
		case "cpu_only":
			return "CPU_ONLY";
	}
}

// ── Model Recommendations ──────────────────────────────

/** Model recommendation for wizard download flow. */
export interface ModelRec {
	/** Human name: "Qwen3-8B" */
	name: string;
	/** Why the user needs it: "Your main AI brain" */
	purpose: string;
	/** Target slot ID: "chat.brain", "voice.stt", etc. */
	slot: string;
	/** Download size in MB */
	sizeMb: number;
	/** Estimated VRAM usage in MB (0 for CPU-only models) */
	vramMb: number;
	/** HuggingFace repo ID: "Qwen/Qwen3-8B-Instruct-GGUF" */
	repo: string;
	/** Filename within repo: "qwen3-8b-instruct-q4_k_m.gguf" */
	file: string;
	/** Where this model runs */
	device: DevicePreference;
}

// ── Import ─────────────────────────────────────────────

/** Import mode for local model files. */
export type ImportMode = "copy" | "symlink";

// ── Resource Allocation ────────────────────────────────

/** Resource allocation tier for VRAM/RAM budget planning. */
export type ResourceTier = "gpu_reserved" | "gpu_shared" | "cpu_ddr" | "disk_cold";

/** Per-slot resource allocation rule. */
export interface ResourceRule {
	slotId: string;
	tier: ResourceTier;
	/** Lower = higher priority for shared GPU access. */
	priority: number;
}

// ── Continue Gates ─────────────────────────────────────

/** Continue gate — evaluated per phase before allowing advance. */
export interface ContinueGate {
	phase: WizardPhase;
	/** Human-readable conditions. */
	conditions: string[];
	/** All conditions met? */
	allMet: boolean;
	/** Why gate is blocked (empty if allMet). */
	blockers: string[];
}

// ── Voice Config ───────────────────────────────────────

/** Voice pipeline delivery mode. */
export type VoiceDeliveryMode = "stream" | "buffer" | "hybrid";

/** Voice pipeline config persisted via preferences. */
export interface VoiceConfig {
	latencyToleranceMs: number;
	deliveryMode: VoiceDeliveryMode;
	memoryLaneProtocol: "rkyv" | "bincode" | "msgpack";
}

// ── Model Browser ──────────────────────────────────────

/** Filter state for the model browser popup. */
export interface ModelBrowserFilter {
	format: "gguf" | "safetensors" | "all";
	maxSizeMb: number | null;
	fitOnly: boolean;
}
