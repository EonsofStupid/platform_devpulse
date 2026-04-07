/**
 * @file Wizard Service
 * @module @devpulse/domains/app/models/features/setup-wizard/service
 *
 * Orchestrates wizard operations. Calls IPC commands, coordinates state updates.
 * NOT a rune — a service with async methods. Does NOT import .svelte files.
 */

import { logError } from "$lib/sys/logger.js";
import { hardwareState } from "../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../runes/models.runes.svelte.js";
import {
	autoConfigureHardware,
	cancelDownload,
	downloadModel,
	onDownloadComplete,
	onDownloadProgress,
} from "../../services/download.service.js";
import type { AutoConfig } from "../../types/models.types.js";
import { formatMb, friendlySlotLabel, isInferenceReady } from "../../types/models.types.js";
import { wizardState } from "./wizard.runes.svelte.js";
import type { ContinueGate, ModelRec, WizardPhase } from "./wizard.types.js";

// ── Phase 1: Hardware ──────────────────────────────────

/**
 * Start hardware detection. Called when user clicks "Let's Go" on WelcomeStep.
 *
 * @throws {Error} If hardware polling fails (NVML unavailable, permission denied)
 * @sideeffects Sets wizardState.hardwareScanned on success, wizardState.error on failure
 */
export async function startHardwareScan(): Promise<void> {
	wizardState.error = null;
	try {
		await hardwareState.startListening();
		wizardState.hardwareScanned = true;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("wizard.hardware", `Hardware scan failed: ${msg}`);
		wizardState.error = msg;
	}
}

/**
 * Fetch auto-configuration recommendations based on detected hardware.
 *
 * @throws {Error} If auto-configure IPC or JSON parse fails
 * @sideeffects Updates wizardState.recommendations on success, wizardState.error on failure
 */
export async function fetchRecommendations(): Promise<void> {
	wizardState.error = null;
	try {
		const raw = await autoConfigureHardware();
		const config: AutoConfig = JSON.parse(raw);
		wizardState.setRecommendations(config);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("wizard.recommendations", `Fetch recommendations failed: ${msg}`);
		wizardState.error = msg;
	}
}

// ── Continue Gates ─────────────────────────────────────

/**
 * Evaluate continue gate for a phase. Determines if user can advance.
 *
 * @returns ContinueGate with conditions, allMet flag, and blockers
 */
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

/**
 * Download a model from HuggingFace and assign it to a slot.
 *
 * @throws {Error} If download fails (network, disk, timeout)
 * @throws {Error} If model not found in registry after successful download
 * @throws {Error} If slot assignment fails
 *
 * Side effects:
 * - Registers and cleans up onDownloadProgress listener
 * - Updates wizardState.activeDownloads throughout lifecycle
 * - Calls modelsState.scan() and modelsState.refresh() on success
 * - Calls modelsState.assign() on success
 * - Fires toast notifications (start, complete/fail)
 */
export async function downloadAndAssign(rec: ModelRec): Promise<void> {
	wizardState.error = null;
	const { toast } = await import("svelte-sonner");

	let downloadId: string;
	try {
		downloadId = await downloadModel(rec.repo, rec.file);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		wizardState.error = msg;
		toast.error(`Download failed: ${msg}`);
		throw e;
	}

	wizardState.trackDownload(downloadId, rec.slot, rec.file);
	toast.info(`Downloading ${rec.name}...`);

	// Wire progress events — THIS WAS THE MISSING LINK
	const unsubProgress = onDownloadProgress((progress) => {
		if (progress.downloadId === downloadId) {
			wizardState.updateDownloadProgress(
				downloadId,
				progress.bytesDownloaded,
				progress.totalBytes,
				progress.speedBps,
			);
		}
	});

	try {
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

		unsubProgress();
		wizardState.completeDownload(downloadId);
		toast.success(`${rec.name} downloaded`);

		await modelsState.scan();
		await modelsState.refresh();

		const model = modelsState.models.find((m) => m.filename === rec.file);
		if (!model) {
			throw new Error(`Downloaded ${rec.file} but not found in registry after scan`);
		}

		await modelsState.assign(rec.slot, model.id);
		toast.success(`${rec.name} assigned to ${friendlySlotLabel(rec.slot)}`);
	} catch (e) {
		unsubProgress();
		const msg = e instanceof Error ? e.message : String(e);
		logError(
			"wizard.download",
			`Download failed: repo=${rec.repo} file=${rec.file} slot=${rec.slot} received=${wizardState.activeDownloads[downloadId]?.bytesDownloaded ?? 0}/${wizardState.activeDownloads[downloadId]?.totalBytes ?? 0} error=${msg}`,
		);
		wizardState.failDownload(downloadId, msg);
		wizardState.error = msg;
		toast.error(`Download failed: ${msg}`);
		throw e;
	}
}

/** Cancel an in-progress download.
 *
 * @throws {Error} If download ID not found or cancel IPC fails
 * Side effects: updates wizardState, fires toast
 */
export async function cancelActiveDownload(downloadId: string): Promise<void> {
	await cancelDownload(downloadId);
	const dl = wizardState.activeDownloads[downloadId];
	if (dl) {
		wizardState.activeDownloads = {
			...wizardState.activeDownloads,
			[downloadId]: { ...dl, status: "cancelled" },
		};
	}
	const { toast } = await import("svelte-sonner");
	toast.info("Download cancelled");
}

/**
 * Auto-assign compatible models to all unassigned user slots.
 * Picks the smallest-VRAM model that has the right capability.
 * OPT-IN — user clicks "Auto-Configure" button.
 *
 * @throws {Error} If assignment IPC fails for a slot (per-slot, non-fatal)
 * @sideeffects Calls modelsState.assign() per slot, fires toast per assignment
 */
export async function autoAssignAllSlots(): Promise<void> {
	const { toast } = await import("svelte-sonner");
	let assigned = 0;

	for (const slot of modelsState.userSlots) {
		if (slot.assigned_model_id) continue;

		const compatible = modelsState.modelsForCapability(slot.capability);
		if (compatible.length === 0) continue;

		const sorted = [...compatible].sort((a, b) => a.vram_estimate_mb - b.vram_estimate_mb);
		const pick = sorted[0];

		try {
			await modelsState.assign(slot.id, pick.id);
			toast.success(`${pick.filename} → ${friendlySlotLabel(slot.id)}`);
			assigned++;
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			logError(
				"wizard.autoAssign",
				`Auto-assign failed: slot=${slot.id} model=${pick.filename} error=${msg}`,
			);
			toast.error(`Failed to assign ${friendlySlotLabel(slot.id)}: ${msg}`);
		}
	}

	if (assigned === 0) {
		toast.info("No unassigned slots with compatible models found");
	}
}

/**
 * Assign a model to a slot and immediately load it. Single-click UX.
 *
 * @throws {Error} If assignment or load fails
 * @sideeffects Updates modelsState via assign() and load(), fires toasts
 */
export async function assignAndLoad(slotId: string, modelId: string): Promise<void> {
	const { toast } = await import("svelte-sonner");
	const model = modelsState.models.find((m) => m.id === modelId);
	if (!model) {
		throw new Error(`Model ${modelId} not found in registry`);
	}

	if (hardwareState.hasGpu && model.vram_estimate_mb > hardwareState.vramFreeMb) {
		toast.warning(
			`${model.filename} needs ~${formatMb(model.vram_estimate_mb)} VRAM but only ${formatMb(hardwareState.vramFreeMb)} free. Loading on CPU.`,
		);
	}

	try {
		await modelsState.assign(slotId, modelId);
		await modelsState.load(slotId);
		toast.success(`${friendlySlotLabel(slotId)} is active`);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("wizard.assignAndLoad", `Failed: slot=${slotId} model=${modelId} error=${msg}`);
		toast.error(`Failed to activate ${friendlySlotLabel(slotId)}: ${msg}`);
		throw e;
	}
}

/**
 * Download all recommendations sequentially, assigning each after download.
 *
 * @throws {Error} Per-download failures are caught and logged (non-fatal)
 * @sideeffects Updates wizardState.downloadQueue and downloadingIndex throughout lifecycle
 */
export async function bulkDownloadAndAssign(recs: ModelRec[]): Promise<void> {
	wizardState.downloadQueue = [...recs];
	wizardState.error = null;

	for (let i = 0; i < recs.length; i++) {
		wizardState.downloadingIndex = i;
		wizardState.downloadProgress = 0;
		try {
			await downloadAndAssign(recs[i]);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			logError(
				"wizard.bulkDownload",
				`Bulk download [${i}] failed: repo=${recs[i].repo} file=${recs[i].file} slot=${recs[i].slot} error=${msg}`,
			);
		}
	}

	wizardState.downloadingIndex = -1;
	wizardState.downloadQueue = [];
}

// ── Phase 4: Clyffy Activation ──────────────────────────

/**
 * Test inference by sending a prompt to a slot.
 *
 * @throws {Error} If slot has no loaded model or inference fails
 * @sideeffects Calls engine inference_generate via IPC
 */
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

/**
 * Create initial dev profile in preferences.
 *
 * @throws {Error} If set_preference IPC fails
 * @sideeffects Writes to libSQL preferences via Tauri, sets wizardState.devProfileExists
 */
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

/**
 * Check if dev profile exists in preferences.
 *
 * @sideeffects Sets wizardState.devProfileExists. Returns false on any error (silent).
 */
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

/**
 * Check if onboarding was already completed (subsequent launch).
 *
 * @sideeffects Reads from libSQL preferences. Returns false on any error (silent).
 */
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

/**
 * Mark onboarding as complete and signal platform.
 *
 * @sideeffects Writes to libSQL preferences, calls complete_model_setup Rust command,
 *   sets wizardState.onboardingComplete. Logs errors but does not throw.
 */
export async function markOnboardingComplete(): Promise<void> {
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		await invoke("set_preference", { key: "onboarding_complete", value: "true" });

		const { commands } = await import("$lib/sys/generated/bindings.js");
		const result = await commands.completeModelSetup();
		if (result.status === "error") {
			logError("wizard.onboarding", `complete_model_setup returned error: ${result.error}`);
		}

		wizardState.onboardingComplete = true;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("wizard.onboarding", `Failed to complete onboarding: ${msg}`);
	}
}

// ── Subsequent Launch Detection ────────────────────────

/**
 * Check if all assigned models still exist on disk.
 *
 * @sideeffects Refreshes modelsState, sets wizardState.missingModels
 */
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

/**
 * Check if hardware changed since last run (compares GPU name).
 *
 * @sideeffects Reads/writes last_gpu_name preference, sets wizardState.hardwareChanged.
 *   Returns false on any error (silent).
 */
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

/**
 * Full subsequent launch check. Determines wizard action on app start.
 *
 * @sideeffects Calls checkOnboardingComplete, detectHardwareChange, validateModelPaths.
 *   Side effects of each sub-function apply.
 */
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
