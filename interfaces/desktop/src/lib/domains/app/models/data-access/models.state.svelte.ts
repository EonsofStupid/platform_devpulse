/**
 * @file modelsState — slot + registry rune.
 * @module @devpulse/domains/app/models/data-access/models-state
 *
 * Singleton Svelte 5 rune that mirrors the kernel's slot orchestrator.
 * Reads via Tauri commands (`getSlots`, `getModelCatalog`); per-slot
 * load status updates arrive on the `model:slot-status` event the
 * kernel emits whenever a slot transitions.
 *
 * Consumed by the Slot Orchestrator devtool, the Models page,
 * `CortexMemoryStrip` in chat, and `DevPulseDashboard`. The shape is
 * stable: `slots`, `models`, `statuses`, plus `scan` / `refresh` /
 * `load` / `unload` verbs that wrap the corresponding Tauri commands.
 */

import { listen } from "@tauri-apps/api/event";
import {
	assignModelToSlot as assignModelToSlotCmd,
	clearSlotAssignment as clearSlotAssignmentCmd,
	getModelCatalog,
	getSlots,
	loadSlot as loadSlotCmd,
	scanModels,
	unloadSlot as unloadSlotCmd,
} from "$lib/sys/bindings/models/index.js";
import type { ModelInfo, SlotInfo } from "$lib/sys/generated/bindings.js";
import type { ModelLoadStatus } from "../util/types.js";

class ModelsState {
	slots = $state<SlotInfo[]>([]);
	models = $state<ModelInfo[]>([]);
	statuses = $state<Record<string, ModelLoadStatus>>({});
	private booted = false;

	/**
	 * Wire up `model:slot-status` listeners + run a one-shot refresh.
	 * Called once at app boot via `bootstrapDownloadBridge()`.
	 */
	async boot(): Promise<void> {
		if (this.booted) return;
		this.booted = true;

		await listen<{
			slot_id: string;
			status: ModelLoadStatus;
		}>("model:slot-status", (event) => {
			const { slot_id, status } = event.payload;
			this.statuses = { ...this.statuses, [slot_id]: status };
		});

		await listen<unknown>("platform:models-status", () => {
			// The kernel pushes a snapshot any time slots or registry
			// change (scan, assign, load, unload, swap). Pull the fresh
			// state so the UI mirrors the kernel without lagging behind.
			// A failure here is non-fatal — the next mutation re-emits.
			this.refresh().catch((e) => {
				console.warn("modelsState: refresh on platform:models-status failed", e);
			});
		});
	}

	/**
	 * Walk the model directory + repopulate the kernel registry.
	 * Use after the user copies new files into the models folder.
	 */
	async scan(): Promise<void> {
		const r = await scanModels();
		if (r.status === "error") {
			console.error("modelsState.scan failed:", r.error);
			throw new Error(`scan failed: ${r.error}`);
		}
	}

	/**
	 * Re-fetch slot definitions + model registry from the kernel.
	 * Cheap (in-memory reads) and idempotent.
	 */
	async refresh(): Promise<void> {
		const [slotsR, catalogR] = await Promise.all([getSlots(), getModelCatalog()]);
		if (slotsR.status === "ok") this.slots = slotsR.data;
		else console.error("modelsState.refresh getSlots failed:", slotsR.error);

		if (catalogR.status === "ok") this.models = catalogR.data;
		else console.error("modelsState.refresh getModelCatalog failed:", catalogR.error);
	}

	/**
	 * Load the model assigned to `slotId`. Optimistically marks the
	 * slot as `loading` so the UI shows a spinner immediately; the
	 * `model:slot-status` event from the kernel supersedes once it
	 * fires.
	 */
	async load(slotId: string): Promise<void> {
		this.statuses = {
			...this.statuses,
			[slotId]: { type: "loading", progressPct: 0 },
		};
		const r = await loadSlotCmd(slotId);
		if (r.status === "error") {
			this.statuses = {
				...this.statuses,
				[slotId]: { type: "failed", error: String(r.error) },
			};
			throw new Error(`load(${slotId}): ${r.error}`);
		}
	}

	/**
	 * Bind a discovered local model to `slotId`. The kernel persists the
	 * choice to its libSQL kv store, validates capability compatibility,
	 * and emits `platform:models-status` on success — the listener above
	 * refreshes the local slot/model views so the UI flips immediately.
	 *
	 * The optimistic local update covers the gap between the assign
	 * acknowledgement and the snapshot event arriving. If the kernel
	 * rejects the assignment (incompatible capability, missing file)
	 * the thrown error surfaces to the caller and the next refresh
	 * reverts the optimistic write.
	 */
	async assign(slotId: string, modelId: string): Promise<void> {
		const r = await assignModelToSlotCmd(slotId, modelId);
		if (r.status === "error") {
			throw new Error(`assign(${slotId} ← ${modelId}): ${r.error}`);
		}
		this.slots = this.slots.map((s) =>
			s.id === slotId ? { ...s, assigned_model_id: modelId } : s,
		);
	}

	/**
	 * Clear the persisted model assignment on `slotId`. Removes the
	 * libSQL `slot.<id>.model` key so the next app launch does NOT
	 * re-attempt the load. Use case: a stuck assignment whose load
	 * crashes the backend — clear it once, the slot stays empty across
	 * restarts until the user assigns a new model.
	 *
	 * Does NOT unload the currently-loaded model from memory (that's
	 * `unload`'s job). Callers wanting both call `unload` first, then
	 * `clearAssignment`.
	 */
	async clearAssignment(slotId: string): Promise<void> {
		const r = await clearSlotAssignmentCmd(slotId);
		if (r.status === "error") {
			throw new Error(`clearAssignment(${slotId}): ${r.error}`);
		}
		this.slots = this.slots.map((s) => (s.id === slotId ? { ...s, assigned_model_id: null } : s));
	}

	/**
	 * Unload the slot. Optimistically marks the slot as `unloading`;
	 * the `model:slot-status` event clears it.
	 */
	async unload(slotId: string): Promise<void> {
		this.statuses = {
			...this.statuses,
			[slotId]: { type: "unloading" },
		};
		const r = await unloadSlotCmd(slotId);
		if (r.status === "error") {
			throw new Error(`unload(${slotId}): ${r.error}`);
		}
		const next = { ...this.statuses };
		delete next[slotId];
		this.statuses = next;
	}
}

export const modelsState = new ModelsState();
