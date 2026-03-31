/**
 * @file Models State Rune
 * @module @devpulse/domains/app/models/runes/models
 *
 * Combined state for registry, slots, assignments, statuses.
 */

import {
	assignModelToSlot,
	getSlots,
	isFirstRun,
	loadSlot,
	scanModels,
	unloadSlot,
} from "../services/index.js";
import type {
	ModelCapability,
	ModelRegistryEntry,
	ModelStatus,
	SlotInfo,
} from "../types/models.types.js";

class ModelsState {
	// ── Registry ────────────────────────────────────────
	models = $state<ModelRegistryEntry[]>([]);
	scanning = $state(false);

	// ── Slots ───────────────────────────────────────────
	slots = $state<SlotInfo[]>([]);
	statuses = $state<Record<string, ModelStatus>>({});

	// ── Global ──────────────────────────────────────────
	firstRun = $state(true);
	loading = $state(false);
	error = $state<string | null>(null);

	// ── Actions ─────────────────────────────────────────

	/** Full refresh — slots + registry + first-run check. Hard fails visible. */
	async refresh(): Promise<void> {
		this.loading = true;
		try {
			const [slots, models, first] = await Promise.all([getSlots(), scanModels(), isFirstRun()]);
			this.slots = slots;
			this.models = models;
			this.firstRun = first;
			this.error = null;

			// Initialize statuses for all slots
			slots.forEach((s) => {
				if (!this.statuses[s.id]) {
					this.statuses[s.id] = { type: "not_loaded" };
				}
			});
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.error = msg;
			console.error(`[ModelsState] HARD FAIL on refresh: ${msg}`);
		} finally {
			this.loading = false;
		}
	}

	/** Scan the models directory for new GGUF files. Hard fail. */
	async scan(): Promise<void> {
		this.scanning = true;
		this.error = null;
		try {
			this.models = await scanModels();
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.error = msg;
			console.error(`[ModelsState] HARD FAIL on scan: ${msg}`);
		} finally {
			this.scanning = false;
		}
	}

	/** Assign a model to a slot. Hard fail — no silent catch. */
	async assign(slotId: string, modelId: string): Promise<void> {
		this.error = null;
		try {
			await assignModelToSlot(slotId, modelId);
			// Update local state
			const slot = this.slots.find((s) => s.id === slotId);
			if (slot) {
				slot.assignedModelId = modelId;
			}
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			throw e;
		}
	}

	/** Load a slot's model. */
	async load(slotId: string): Promise<void> {
		this.statuses[slotId] = { type: "loading", stage: "verifying", progressPct: 0 };
		try {
			await loadSlot(slotId);
			this.statuses[slotId] = {
				type: "loaded",
				footprint: { ramBytes: 0, vramBytes: 0 },
			};
		} catch (e) {
			this.statuses[slotId] = {
				type: "failed",
				error: e instanceof Error ? e.message : String(e),
			};
			throw e;
		}
	}

	/** Unload a slot's model. Hard fail — error surfaces. */
	async unload(slotId: string): Promise<void> {
		this.statuses[slotId] = { type: "unloading" };
		try {
			await unloadSlot(slotId);
			this.statuses[slotId] = { type: "not_loaded" };
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.error = msg;
			this.statuses[slotId] = { type: "failed", error: msg };
			console.error(`[ModelsState] HARD FAIL on unload ${slotId}: ${msg}`);
			throw e;
		}
	}

	// ── Derived ─────────────────────────────────────────

	/** Models compatible with a specific capability. */
	modelsForCapability(cap: ModelCapability): ModelRegistryEntry[] {
		return this.models.filter((m) => m.compatibleCapabilities.includes(cap));
	}

	/** Get assigned model for a slot. */
	assignedModel(slotId: string): ModelRegistryEntry | null {
		const slot = this.slots.find((s) => s.id === slotId);
		if (!slot?.assignedModelId) return null;
		return this.models.find((m) => m.id === slot.assignedModelId) ?? null;
	}

	/** Slots grouped by subsystem. */
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
			minion: "Minions",
			rag: "Search Pipeline",
			vision: "Vision",
			voice: "Voice",
		};
	}
}

export const modelsState = new ModelsState();
