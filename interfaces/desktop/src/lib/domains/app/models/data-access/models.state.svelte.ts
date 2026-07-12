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
	getSlots,
	loadSlot as loadSlotCmd,
	scanModels,
	unloadSlot as unloadSlotCmd,
} from "$lib/sys/bindings/models/index.js";
import type { ModelInfo, SlotInfo } from "$lib/sys/generated/bindings.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";
import type { ModelLoadStatus } from "../util/types.js";

/**
 * Wire payload from the `platform:models-status` Tauri event. The
 * kernel pushes a `StatusUpdate` envelope (`{ kind: "data", data: {...} }`)
 * with the full slot + registry snapshot whenever models or slots
 * mutate. We accept either the envelope or a raw payload for
 * backwards compatibility with the boot-snapshot replay format
 * defined in `platformState.svelte.ts`.
 */
interface ModelsStatusEnvelope {
	kind?: string;
	data?: {
		slots?: SlotInfo[];
		models?: ModelInfo[];
		firstRun?: boolean;
	};
	slots?: SlotInfo[];
	models?: ModelInfo[];
}

class ModelsState {
	slots = $state<SlotInfo[]>([]);
	/**
	 * Registry of every discovered model. Populated from the kernel
	 * `platform:models-status` event (`ModelsStatusData.models`) which
	 * mirrors `loader.get_registry()` post-mutation. Initial fill comes
	 * from a one-shot `scanModels()` at boot — subsequent updates flow
	 * exclusively through the event listener so the UI never lags the
	 * authoritative kernel state.
	 */
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

		await listen<ModelsStatusEnvelope>("platform:models-status", (event) => {
			// The kernel pushes a snapshot any time slots or registry
			// change (scan, assign, load, unload, swap). Accept either
			// the `emit_status` envelope (`{ kind, data }`) or the raw
			// payload (boot-snapshot replay shape).
			const p = event.payload;
			const payload = p?.kind === "data" && p.data ? p.data : p;
			if (Array.isArray(payload?.slots)) {
				this.slots = payload.slots;
			}
			if (Array.isArray(payload?.models)) {
				this.models = payload.models;
			}
		});

		// Gate the one-shot refresh on platform readiness. `getSlots` /
		// `scanModels` route through the engine loader and reject with
		// "Platform not ready" until boot_task stores the platform (~9s
		// into boot). Listeners are already attached above, so no live
		// `model:slot-status` / `platform:models-status` event is lost
		// while we wait.
		await platformState.whenReady();

		// One-shot boot refresh — covers the window before the live
		// `platform:models-status` event arrives.
		await this.refresh().catch((e) => {
			console.warn("modelsState: initial refresh failed", e);
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
	 *
	 * Slots are cheap (in-memory list). The registry call (`scanModels`)
	 * walks the models directory, so we only run it on initial boot.
	 * Subsequent refreshes ride the `platform:models-status` event,
	 * which carries the full registry snapshot the kernel just
	 * computed — zero extra IO.
	 */
	async refresh(): Promise<void> {
		const [slotsR, modelsR] = await Promise.all([getSlots(), scanModels()]);
		if (slotsR.status === "ok") this.slots = slotsR.data;
		else console.error("modelsState.refresh getSlots failed:", slotsR.error);

		if (modelsR.status === "ok") this.models = modelsR.data;
		else console.error("modelsState.refresh scanModels failed:", modelsR.error);
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
