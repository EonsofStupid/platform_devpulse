/**
 * @file Models State Rune
 * @module @devpulse/domains/app/models/data-access/models
 *
 * Combined state for registry, slots, assignments, statuses.
 */

import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { ModelInfo, SlotInfo } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";
import type { ModelStatus } from "../util/models.types.js";
import {
	assignModelToSlot,
	getSlots,
	isFirstRun,
	loadSlot,
	scanModels,
	swapSlotModel,
	unloadSlot,
	warmSlot,
} from "./index.js";

class ModelsState {
	// ── Registry ────────────────────────────────────────
	models = $state<ModelInfo[]>([]);
	scanning = $state(false);

	// ── Slots ───────────────────────────────────────────
	slots = $state<SlotInfo[]>([]);
	statuses = $state<Record<string, ModelStatus>>({});

	// ── Global ──────────────────────────────────────────
	firstRun = $state(true);
	loading = $state(false);
	error = $state<string | null>(null);
	private statusUnlisten: UnlistenFn | null = null;

	// ── Actions ─────────────────────────────────────────

	/** Full refresh — slots + registry + first-run check. Hard fails visible. */
	async refresh(): Promise<void> {
		this.loading = true;
		logInfo("models", "refresh() start — getSlots + scanModels + isFirstRun (parallel)");
		try {
			const [slots, models, first] = await Promise.all([getSlots(), scanModels(), isFirstRun()]);
			this.slots = slots;
			this.models = models;
			this.firstRun = first;
			this.error = null;

			// Initialize statuses for all slots
			slots.forEach((s) => {
				if (!this.statuses[s.id]) {
					this.statuses[s.id] = { type: "cold" };
				}
			});
			logInfo(
				"models",
				`refresh() ok — slots=${slots.length} models=${models.length} firstRun=${first}`,
			);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.error = msg;
			logError("models", `refresh() FAILED: ${msg}`);
		} finally {
			this.loading = false;
		}
	}

	/** Scan the models directory for new GGUF files. Hard fail. */
	async scan(): Promise<void> {
		this.scanning = true;
		this.error = null;
		logInfo("models", "scan() start — scanModels()");
		try {
			this.models = await scanModels();
			logInfo("models", `scan() ok — models=${this.models.length}`);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.error = msg;
			logError("models", `scan() FAILED: ${msg}`);
		} finally {
			this.scanning = false;
		}
	}

	/** Assign a model to a slot. Hard fail — no silent catch. */
	async assign(slotId: string, modelId: string): Promise<void> {
		this.error = null;
		logInfo("models", `assign() start — slot=${slotId} modelId=${modelId}`);
		try {
			await assignModelToSlot(slotId, modelId);
			logInfo("models", `assign() IPC assignModelToSlot ok — slot=${slotId}`);
			await this.refresh();
			logInfo("models", `assign() complete — slot=${slotId} modelId=${modelId}`);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.error = msg;
			logError("models", `assign() FAILED — slot=${slotId} modelId=${modelId}: ${msg}`);
			throw e;
		}
	}

	/** Warm a slot — load weights to CPU RAM only. Fast activation later. */
	async warm(slotId: string): Promise<void> {
		logInfo("models", `warm() start — slot=${slotId}`);
		const { swapState } = await import("./swap.state.svelte.js");
		swapState.startLoad(slotId);
		this.statuses[slotId] = { type: "loading", stage: "loading_weights", progressPct: 0 };
		try {
			await warmSlot(slotId);
			this.statuses[slotId] = {
				type: "warm",
			};
			swapState.complete();
			logInfo("models", `warm() complete — slot=${slotId}`);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.statuses[slotId] = { type: "failed", error: msg };
			swapState.fail(msg);
			logError("models", `warm() FAILED — slot=${slotId}: ${msg}`);
			throw e;
		}
	}

	/** Load a slot's model. Activates SwapOverlay for full-screen block. */
	async load(slotId: string): Promise<void> {
		logInfo("models", `load() start — slot=${slotId}`);
		const { swapState } = await import("./swap.state.svelte.js");
		swapState.startLoad(slotId);
		this.statuses[slotId] = { type: "loading", stage: "verifying", progressPct: 0 };
		try {
			await loadSlot(slotId);
			this.statuses[slotId] = {
				type: "hot",
				footprint: { ramBytes: 0, vramBytes: 0 },
			};
			swapState.complete();
			logInfo("models", `load() complete — slot=${slotId}`);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.statuses[slotId] = { type: "failed", error: msg };
			swapState.fail(msg);
			logError("models", `load() FAILED — slot=${slotId}: ${msg}`);
			throw e;
		}
	}

	/** Unload a slot's model. Activates SwapOverlay. Hard fail — error surfaces. */
	async unload(slotId: string): Promise<void> {
		logInfo("models", `unload() start — slot=${slotId}`);
		const { swapState } = await import("./swap.state.svelte.js");
		swapState.startUnload(slotId);
		this.statuses[slotId] = { type: "unloading" };
		try {
			await unloadSlot(slotId);
			this.statuses[slotId] = { type: "cold" };
			swapState.complete();
			logInfo("models", `unload() complete — slot=${slotId}`);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.error = msg;
			this.statuses[slotId] = { type: "failed", error: msg };
			swapState.fail(msg);
			logError("models", `unload() FAILED — slot=${slotId}: ${msg}`);
			throw e;
		}
	}

	/**
	 * Atomically swap the model on a loaded slot.
	 * Triggers SwapOverlay via swap events from Rust.
	 * If slot is not loaded, falls back to assign().
	 */
	async swap(slotId: string, newModelId: string): Promise<void> {
		logInfo("models", `swap() start — slot=${slotId} newModelId=${newModelId}`);
		const { swapState } = await import("./swap.state.svelte.js");
		swapState.startLoad(slotId);
		this.error = null;
		try {
			await swapSlotModel(slotId, newModelId);
			logInfo("models", `swap() IPC swapSlotModel ok — slot=${slotId}`);
			// SwapOverlay is driven by Tauri events (swap-complete/swap-failed),
			// not by this Promise. The overlay auto-dismisses on completion.
			await this.refresh();
			logInfo("models", `swap() complete — slot=${slotId}`);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.error = msg;
			// swapState.fail() is called by the swap-failed event listener
			logError("models", `swap() FAILED — slot=${slotId} newModelId=${newModelId}: ${msg}`);
			throw e;
		}
	}

	/**
	 * Listen for platform:models-status events from Rust.
	 * Emitted after boot and after complete_model_setup.
	 * Triggers a refresh so the UI reflects the latest state.
	 */
	async startStatusListener(): Promise<void> {
		this.stopStatusListener();
		logInfo("models", "startStatusListener() — subscribing to platform:models-status");
		this.statusUnlisten = await listen("platform:models-status", () => {
			logInfo("models", "platform:models-status event — refresh()");
			this.refresh();
		});
	}

	/** Stop listening for platform:models-status. */
	stopStatusListener(): void {
		if (this.statusUnlisten) {
			this.statusUnlisten();
			this.statusUnlisten = null;
		}
	}

	// ── Derived ─────────────────────────────────────────

	/** Models compatible with a specific capability. */
	modelsForCapability(cap: string): ModelInfo[] {
		return this.models.filter((m) => m.compatible_capabilities.includes(cap));
	}

	/** Get assigned model for a slot. */
	assignedModel(slotId: string): ModelInfo | null {
		const slot = this.slots.find((s) => s.id === slotId);
		if (!slot?.assigned_model_id) return null;
		return this.models.find((m) => m.id === slot.assigned_model_id) ?? null;
	}

	/** User-managed slots only (visible in Model Loader UI). */
	get userSlots(): SlotInfo[] {
		return this.slots.filter((s) => !s.embedded);
	}

	/** Bundled slots (invisible in UI, auto-loaded on boot). */
	get bundledSlots(): SlotInfo[] {
		return this.slots.filter((s) => s.embedded);
	}

	/** User-managed slots grouped by subsystem (for Model Loader panel). */
	get userSubsystems(): Record<string, SlotInfo[]> {
		const groups: Record<string, SlotInfo[]> = {};
		this.userSlots.forEach((s) => {
			const sub = s.id.split(".")[0];
			if (!groups[sub]) groups[sub] = [];
			groups[sub].push(s);
		});
		return groups;
	}

	/** All slots grouped by subsystem (for dev tools / connectome). */
	get subsystems(): Record<string, SlotInfo[]> {
		const groups: Record<string, SlotInfo[]> = {};
		this.slots.forEach((s) => {
			const sub = s.id.split(".")[0];
			if (!groups[sub]) groups[sub] = [];
			groups[sub].push(s);
		});
		return groups;
	}

	/** Subsystem display names. */
	get subsystemLabels(): Record<string, string> {
		return {
			chat: "Chat",
			minion: "Helpers",
			rag: "Search Pipeline",
			vision: "Vision",
			voice: "Voice",
		};
	}
}

export const modelsState = new ModelsState();
