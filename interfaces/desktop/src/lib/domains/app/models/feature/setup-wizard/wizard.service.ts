/**
 * @file Wizard Service
 * @module @devpulse/domains/app/models/feature/setup-wizard/service
 *
 * Orchestrates wizard operations. Calls IPC commands, coordinates state updates.
 * NOT a rune — a service with async methods. Does NOT import .svelte files.
 *
 * Runtime truth (slots, registry, presets, auto-config) lives in the engine/Rust
 * side — this module is orchestration + view-model updates only. Never treat
 * `wizardState` mirrors as authoritative over IPC results.
 */

import { invoke } from "@tauri-apps/api/core";
import { logError, logInfo } from "$lib/sys/logger.js";
import {
	autoConfigureHardware,
	cancelDownload,
	type DownloadCompleteEvent,
	downloadModel,
	onDownloadCancelled,
	onDownloadComplete,
	onDownloadFailed,
} from "../../data-access/download.service.js";
import { hardwareState } from "../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../data-access/models.state.svelte.js";
import type { AutoConfig, SlotId } from "../../util/models.types.js";
import { formatMb, friendlySlotLabel } from "../../util/models.types.js";
import { wizardState } from "./wizard.state.svelte.js";
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
	logInfo("wizard.hardware", "startHardwareScan() — ensure app hardware telemetry");
	try {
		await hardwareState.ensureListening("wizard-start");
		if (!hardwareState.hasSnapshot) {
			await hardwareState.refresh("wizard-start:no-snapshot");
		}
		wizardState.hardwareScanned = hardwareState.hasSnapshot;
		logInfo(
			"wizard.hardware",
			`startHardwareScan() ok — hardwareScanned=${String(wizardState.hardwareScanned)} cpu=${hardwareState.cpuName ?? "none"} gpu=${hardwareState.gpuName ?? "none"} gpuError=${hardwareState.gpuError ?? "none"}`,
		);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("wizard.hardware", `Hardware scan failed: ${msg}`);
		wizardState.error = msg;
	}
}

/**
 * Fetch auto-configuration recommendations based on detected hardware.
 *
 * Returns the parsed config on success and `null` on failure so the caller
 * can react — previously errors were swallowed into `wizardState.error` and
 * the welcome page would silently render a blank "detected" state.
 *
 * @sideeffects Updates wizardState.recommendations on success, wizardState.error on failure
 */
export async function fetchRecommendations(): Promise<AutoConfig | null> {
	wizardState.error = null;
	logInfo("wizard.recommendations", "fetchRecommendations() — autoConfigureHardware()");
	try {
		const raw = await autoConfigureHardware();
		const config: AutoConfig = JSON.parse(raw);
		wizardState.setRecommendations(config);
		wizardState.selectedPresetName = config.preset_name;
		logInfo(
			"wizard.recommendations",
			`fetchRecommendations() ok — preset=${config.preset_name} recs=${config.recommendations?.length ?? 0}`,
		);
		return config;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("wizard.recommendations", `Fetch recommendations failed: ${msg}`);
		wizardState.error = msg;
		return null;
	}
}

/**
 * List every hardware preset the platform knows about, in display order
 * (highest tier first). Used by the welcome preset picker so the owner
 * can override the auto-detected default.
 *
 * Returns an empty array on failure so callers can show a fallback state
 * without having to catch.
 */
export async function listAllPresets(): Promise<AutoConfig[]> {
	logInfo("wizard.presets", "listAllPresets() — list_presets IPC");
	try {
		const raw = await invoke<string>("list_presets");
		const out = JSON.parse(raw) as AutoConfig[];
		logInfo("wizard.presets", `listAllPresets() ok — count=${out.length}`);
		return out;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("wizard.presets", `list_presets failed: ${msg}`);
		return [];
	}
}

/**
 * Switch the wizard to a specific preset — used when the owner picks a
 * non-default preset from the welcome picker. Fetches the fresh config
 * for that tier (so `already_downloaded` flags are accurate) and updates
 * `wizardState.recommendations` + `selectedPresetName`.
 *
 * `tier` must be one of: `high`, `jesse_primary`, `mid`, `floor`,
 * `minimal`, `cpu_only`.
 */
export async function selectPreset(tier: string): Promise<AutoConfig | null> {
	wizardState.error = null;
	logInfo("wizard.presets", `selectPreset() — tier=${tier} (config_for_tier IPC)`);
	try {
		const raw = await invoke<string>("config_for_tier", { tier });
		const config: AutoConfig = JSON.parse(raw);
		wizardState.setRecommendations(config);
		wizardState.selectedPresetName = config.preset_name;
		logInfo("wizard.presets", `selectPreset() ok — preset=${config.preset_name}`);
		return config;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("wizard.presets", `selectPreset(${tier}) failed: ${msg}`);
		wizardState.error = msg;
		return null;
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
			const conditions = ["At least one model assigned or downloads started"];
			const anyAssigned = modelsState.userSlots.some((s) => !!s.assigned_model_id);
			const anyDownloading = wizardState.hasActiveDownloads;
			const allMet = anyAssigned || anyDownloading;
			const blockers: string[] = [];
			if (!allMet) blockers.push("Set up your AI models to continue.");
			return { phase, conditions, allMet, blockers };
		}
		case "customize":
		case "browse": {
			// Sub-pages — always passable, user navigates back to models
			return { phase, conditions: [], allMet: true, blockers: [] };
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
 * Wait for a single download to reach a real terminal state.
 *
 * Ownership of live progress stays with the root `download-bootstrap`
 * bridge. This helper only gates orchestration on terminal kernel events:
 * complete, failed, or cancelled.
 */
function waitForDownloadTerminalState(downloadId: string): Promise<DownloadCompleteEvent> {
	return new Promise<DownloadCompleteEvent>((resolve, reject) => {
		let settled = false;
		let unsubComplete = () => {};
		let unsubFailed = () => {};
		let unsubCancelled = () => {};

		const timeout = setTimeout(
			() => {
				finish();
				reject(new Error("Download timed out after 30 minutes"));
			},
			30 * 60 * 1000,
		);

		const finish = (): void => {
			if (settled) return;
			settled = true;
			clearTimeout(timeout);
			unsubComplete();
			unsubFailed();
			unsubCancelled();
		};

		unsubComplete = onDownloadComplete((data) => {
			if (data.downloadId !== downloadId) return;
			finish();
			resolve(data);
		});

		unsubFailed = onDownloadFailed((data) => {
			if (data.downloadId !== downloadId) return;
			finish();
			reject(new Error(data.error));
		});

		unsubCancelled = onDownloadCancelled((data) => {
			if (data.downloadId !== downloadId) return;
			finish();
			reject(new Error("Cancelled by user"));
		});
	});
}

/**
 * Download a model from HuggingFace and assign it to a slot.
 *
 * @throws {Error} If download fails (network, disk, timeout)
 * @throws {Error} If model not found in registry after successful download
 * @throws {Error} If slot assignment fails
 *
 * Side effects:
 * - Waits for terminal kernel download events
 * - Updates wizardState.activeDownloads throughout lifecycle
 * - Calls modelsState.scan() and modelsState.refresh() on success
 * - Calls modelsState.assign() on success
 * - Fires toast notifications (start, complete/fail)
 */
export async function downloadAndAssign(rec: ModelRec): Promise<void> {
	wizardState.error = null;
	const { toast } = await import("svelte-sonner");
	logInfo(
		"wizard.download",
		`downloadAndAssign() start — slot=${rec.slot} file=${rec.file} repo=${rec.repo}`,
	);

	let downloadId: string;
	try {
		downloadId = await downloadModel(rec.repo, rec.file);
		logInfo("wizard.download", `downloadModel() ok — downloadId=${downloadId} slot=${rec.slot}`);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		wizardState.error = msg;
		toast.error(`Download failed: ${msg}`);
		throw e;
	}

	wizardState.trackDownload(downloadId, rec.slot, rec.file);
	toast.info(`Downloading ${rec.name}...`);

	try {
		await waitForDownloadTerminalState(downloadId);

		wizardState.completeDownload(downloadId);
		toast.success(`${rec.name} downloaded`);

		logInfo("wizard.download", `post-download — scanModels + refresh slot=${rec.slot}`);
		await modelsState.scan();
		await modelsState.refresh();

		const model = modelsState.models.find((m) => m.filename === rec.file);
		if (!model) {
			throw new Error(`Downloaded ${rec.file} but not found in registry after scan`);
		}

		logInfo(
			"wizard.download",
			`assign after download — slot=${rec.slot} modelId=${model.id} file=${rec.file}`,
		);
		await modelsState.assign(rec.slot, model.id);
		toast.success(`${rec.name} assigned to ${friendlySlotLabel(rec.slot)}`);
		logInfo("wizard.download", `downloadAndAssign() complete — slot=${rec.slot}`);
	} catch (e) {
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

/**
 * Download an arbitrary HuggingFace file, wait for the real backend completion
 * event, then assign the resulting registry model to the chosen slot.
 *
 * Used by the Browse step where we do not have a full `ModelRec` upfront.
 */
export async function downloadAndAssignFile(
	repoId: string,
	filename: string,
	slotId: SlotId,
): Promise<void> {
	wizardState.error = null;
	const { toast } = await import("svelte-sonner");
	const slotLabel = friendlySlotLabel(slotId);

	let downloadId: string;
	try {
		downloadId = await downloadModel(repoId, filename);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		wizardState.error = msg;
		toast.error(`Download failed: ${msg}`);
		throw e;
	}

	wizardState.trackDownload(downloadId, slotId, filename);
	toast.info(`Downloading ${filename}...`);

	try {
		const data = await waitForDownloadTerminalState(downloadId);
		wizardState.completeDownload(downloadId);
		await modelsState.scan();
		await modelsState.refresh();
		await modelsState.assign(slotId, data.modelId);
		toast.success(`${filename} assigned to ${slotLabel}`);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		wizardState.failDownload(downloadId, msg);
		wizardState.error = msg;
		toast.error(`Download failed: ${msg}`);
		throw e instanceof Error ? e : new Error(msg);
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
		logInfo("wizard.assignAndLoad", `assignAndLoad() — assign slot=${slotId} modelId=${modelId}`);
		await modelsState.assign(slotId, modelId);
		logInfo("wizard.assignAndLoad", `assignAndLoad() — load slot=${slotId}`);
		await modelsState.load(slotId);
		toast.success(`${friendlySlotLabel(slotId)} is active`);
		logInfo("wizard.assignAndLoad", `assignAndLoad() complete — slot=${slotId}`);
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
	logInfo("wizard.bulkDownload", `bulkDownloadAndAssign() start — count=${recs.length}`);

	for (let i = 0; i < recs.length; i++) {
		wizardState.downloadingIndex = i;
		wizardState.downloadProgress = 0;
		logInfo(
			"wizard.bulkDownload",
			`bulk item [${i + 1}/${recs.length}] slot=${recs[i].slot} file=${recs[i].file}`,
		);
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
	logInfo("wizard.bulkDownload", "bulkDownloadAndAssign() finished — queue cleared");
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
	const { generateText } = await import("../../data-access/inference.service.js");
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
