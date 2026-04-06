/**
 * @file Wizard Service
 * @module @devpulse/domains/app/models/features/setup-wizard/service
 *
 * Orchestrates wizard operations. Calls IPC commands, coordinates state updates.
 * NOT a rune — a service with async methods. Does NOT import .svelte files.
 */

import { hardwareState } from "../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../runes/models.runes.svelte.js";
import {
	autoConfigureHardware,
	downloadModel,
	onDownloadComplete,
} from "../../services/download.service.js";
import type { AutoConfig } from "../../types/models.types.js";
import { isInferenceReady } from "../../types/models.types.js";
import { wizardState } from "./wizard.runes.svelte.js";
import type { ContinueGate, ModelRec, WizardPhase } from "./wizard.types.js";

// ── Phase 1: Hardware ──────────────────────────────────

/** Start hardware detection. Called when user clicks "Let's Go" on WelcomeStep. */
export async function startHardwareScan(): Promise<void> {
	wizardState.error = null;
	try {
		await hardwareState.startListening();
		wizardState.hardwareScanned = true;
	} catch (e) {
		wizardState.error = e instanceof Error ? e.message : String(e);
	}
}

/** Fetch auto-configuration recommendations based on detected hardware. */
export async function fetchRecommendations(): Promise<void> {
	wizardState.error = null;
	try {
		const raw = await autoConfigureHardware();
		const config: AutoConfig = JSON.parse(raw);
		wizardState.setRecommendations(config);
	} catch (e) {
		wizardState.error = e instanceof Error ? e.message : String(e);
	}
}

// ── Continue Gates ─────────────────────────────────────

/** Evaluate continue gate for a phase. */
export function evaluateContinueGate(phase: WizardPhase): ContinueGate {
	switch (phase) {
		case "hardware": {
			const conditions = ["Hardware metrics detected"];
			const metricsPresent = hardwareState.metrics !== null;
			const notLoading = !hardwareState.loading;
			const allMet = metricsPresent && notLoading;
			const blockers: string[] = [];
			if (!metricsPresent) blockers.push("Waiting for hardware scan to complete");
			if (hardwareState.loading) blockers.push("Scan in progress...");
			return { phase, conditions, allMet, blockers };
		}
		case "models": {
			const conditions = ["Brain model (chat.brain) must be inference-ready"];
			const brainStatus = modelsState.statuses["chat.brain"];
			const brainReady = brainStatus ? isInferenceReady(brainStatus) : false;
			const blockers: string[] = [];
			if (!brainReady)
				blockers.push(
					"We need the main brain loaded before we can move on. Pick a model and hit Load.",
				);
			return { phase, conditions, allMet: brainReady, blockers };
		}
		case "voice": {
			const conditions = ["STT model assigned", "TTS model assigned", "Voice brain assigned"];
			const sttSlot = modelsState.slots.find((s) => s.id === "voice.stt");
			const ttsSlot = modelsState.slots.find((s) => s.id === "voice.tts");
			const brainSlot = modelsState.slots.find((s) => s.id === "voice.brain");
			const sttAssigned = !!sttSlot?.assigned_model_id;
			const ttsAssigned = !!ttsSlot?.assigned_model_id;
			const brainAssigned = !!brainSlot?.assigned_model_id;
			const allMet = sttAssigned && ttsAssigned && brainAssigned;
			const blockers: string[] = [];
			if (!sttAssigned) blockers.push("Voice Input (STT) needs a model assigned");
			if (!ttsAssigned) blockers.push("Clyffy's Voice (TTS) needs a model assigned");
			if (!brainAssigned) blockers.push("Voice Brain needs a model assigned for quick responses");
			return { phase, conditions, allMet, blockers };
		}
		case "clyffy": {
			const conditions = ["3+ successful exchanges OR manual confirm"];
			const allMet = wizardState.roundTripCount >= 3 || wizardState.clyfConfirmed;
			const blockers: string[] = [];
			if (!allMet) blockers.push("Have a conversation with Clyffy or confirm manually");
			return { phase, conditions, allMet, blockers };
		}
		case "project": {
			return {
				phase: "project",
				conditions: ["Dev profile created or skipped"],
				allMet: true,
				blockers: [],
			};
		}
		case "completion": {
			return {
				phase: "completion",
				conditions: [],
				allMet: true,
				blockers: [],
			};
		}
	}
}

// ── Phase 2: Download + Assign ─────────────────────────

/** Download a single model and assign it to its target slot. */
export async function downloadAndAssign(rec: ModelRec): Promise<void> {
	wizardState.error = null;
	try {
		const downloadId = await downloadModel(rec.repo, rec.file);

		await new Promise<void>((resolve, reject) => {
			const unsub = onDownloadComplete((data) => {
				if (data.downloadId === downloadId) {
					unsub();
					resolve();
				}
			});
			setTimeout(
				() => {
					unsub();
					reject(new Error("Download timed out after 30 minutes"));
				},
				30 * 60 * 1000,
			);
		});

		await modelsState.scan();
		await modelsState.refresh();

		const model = modelsState.models.find((m) => m.filename === rec.file);
		if (!model) {
			throw new Error(`Downloaded ${rec.file} but not found in registry after scan`);
		}

		await modelsState.assign(rec.slot, model.id);
	} catch (e) {
		wizardState.error = e instanceof Error ? e.message : String(e);
		throw e;
	}
}

/** Download all recommendations sequentially, assigning each after download. */
export async function bulkDownloadAndAssign(recs: ModelRec[]): Promise<void> {
	wizardState.downloadQueue = [...recs];
	wizardState.error = null;

	for (let i = 0; i < recs.length; i++) {
		wizardState.downloadingIndex = i;
		wizardState.downloadProgress = 0;
		try {
			await downloadAndAssign(recs[i]);
		} catch (e) {
			console.error(`[wizard] Failed to download ${recs[i].file}:`, e);
		}
	}

	wizardState.downloadingIndex = -1;
	wizardState.downloadQueue = [];
}

// ── Phase 4: Clyffy Activation ──────────────────────────

/** Test inference by sending a prompt to a slot. */
export async function testInference(
	slotId: string,
	prompt: string,
	maxTokens = 256,
	temperature = 0.7,
): Promise<string> {
	const { generateText } = await import("../../services/inference.service.js");
	return generateText(slotId, prompt, maxTokens, temperature);
}

// ── Phase 5: Project Setup ──────────────────────────────

/** Create initial dev profile in preferences. */
export async function createDevProfile(): Promise<void> {
	const { invoke } = await import("@tauri-apps/api/core");
	const profile = {
		type: "dev",
		created: new Date().toISOString(),
		indexedProjects: [],
	};
	await invoke("set_preference", {
		key: "dev_profile",
		value: JSON.stringify(profile),
	});
	wizardState.devProfileExists = true;
}

/** Check if dev profile exists. */
export async function checkDevProfile(): Promise<boolean> {
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		const result = await invoke<string | null>("get_preference", { key: "dev_profile" });
		const exists = result !== null;
		wizardState.devProfileExists = exists;
		return exists;
	} catch {
		return false;
	}
}

// ── Onboarding Persistence ─────────────────────────────

/** Check if onboarding was already completed (subsequent launch). */
export async function checkOnboardingComplete(): Promise<boolean> {
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		const result = await invoke<string | null>("get_preference", {
			key: "onboarding_complete",
		});
		return result === "true";
	} catch {
		return false;
	}
}

/** Mark onboarding as complete and signal platform. */
export async function markOnboardingComplete(): Promise<void> {
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		await invoke("set_preference", { key: "onboarding_complete", value: "true" });

		const { commands } = await import("$lib/sys/generated/bindings.js");
		const result = await commands.completeModelSetup();
		if (result.status === "error") {
			console.error("[wizard.service] complete_model_setup:", result.error);
		}

		wizardState.onboardingComplete = true;
	} catch (e) {
		console.error("[wizard.service] Failed to complete onboarding:", e);
	}
}

// ── Subsequent Launch Detection ────────────────────────

/** Check if all assigned models still exist on disk. */
export async function validateModelPaths(): Promise<{ valid: boolean; missing: string[] }> {
	const missing: string[] = [];

	await modelsState.refresh();

	modelsState.slots.forEach((slot) => {
		if (slot.assigned_model_id) {
			const model = modelsState.models.find((m) => m.id === slot.assigned_model_id);
			if (!model) {
				missing.push(slot.id);
			}
		}
	});

	wizardState.missingModels = missing;
	return { valid: missing.length === 0, missing };
}

/** Check if hardware changed since last run. */
export async function detectHardwareChange(): Promise<boolean> {
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		const lastGpu = await invoke<string | null>("get_preference", { key: "last_gpu_name" });

		await hardwareState.refresh();
		const currentGpu = hardwareState.gpuName;

		await invoke("set_preference", { key: "last_gpu_name", value: currentGpu });

		if (lastGpu === null) {
			return false;
		}

		const changed = lastGpu !== currentGpu;
		wizardState.hardwareChanged = changed;
		return changed;
	} catch {
		return false;
	}
}

/** Full subsequent launch check. Returns what to do. */
export async function subsequentLaunchCheck(): Promise<
	| { action: "skip"; reason: "complete_and_valid" }
	| { action: "wizard"; reason: "not_complete" }
	| { action: "repair"; missingSlots: string[] }
	| { action: "redetect"; reason: "hardware_changed" }
> {
	const complete = await checkOnboardingComplete();
	if (!complete) {
		return { action: "wizard", reason: "not_complete" };
	}

	const hwChanged = await detectHardwareChange();
	if (hwChanged) {
		return { action: "redetect", reason: "hardware_changed" };
	}

	const { valid, missing } = await validateModelPaths();
	if (!valid) {
		return { action: "repair", missingSlots: missing };
	}

	return { action: "skip", reason: "complete_and_valid" };
}
