/**
 * @file Wizard Types
 * @module @devpulse/domains/app/models/features/setup-wizard/types
 *
 * All types for the 5-phase dev onboarding wizard.
 * Does NOT duplicate types from models.types.ts — imports them.
 * Derives from engine SSOT: events.rs (AllocationMode, LoadingState, SlotId).
 */

import type { DevicePreference, HardwareTier, SlotId } from "../../types/models.types.js";

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

// ── Allocation Mode (mirrors engine AllocationMode from events.rs) ──

/**
 * Hardware allocation mode — mirrors engine AllocationMode.
 * Determines the VRAM budget envelope for the entire session.
 */
export type AllocationMode = "cpu_only" | "budget" | "standard" | "high" | "flagship";

export const ALLOCATION_MODES: AllocationMode[] = [
	"cpu_only",
	"budget",
	"standard",
	"high",
	"flagship",
];

/** Map HardwareTier to AllocationMode. */
export function tierToAllocation(tier: HardwareTier, vramTotalMb?: number): AllocationMode {
	switch (tier) {
		case "high":
			return (vramTotalMb ?? 0) >= 16000 ? "flagship" : "high";
		case "medium":
			return "standard";
		case "low":
			return "budget";
		case "minimal":
		case "cpu_only":
			return "cpu_only";
	}
}

/** Human label for allocation mode. */
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
	/** Target slot ID — typed against platform.default.toml registry. */
	slot: SlotId;
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
}

// ── Model Browser ──────────────────────────────────────

/** Filter state for the model browser popup. */
export interface ModelBrowserFilter {
	format: "gguf" | "safetensors" | "all";
	maxSizeMb: number | null;
	fitOnly: boolean;
}
