/**
 * @file modelsState — slot + registry rune.
 * @module @devpulse/domains/app/models/data-access/models-state
 *
 * Singleton Svelte 5 rune that mirrors the kernel's slot orchestrator.
 * Rust publishes a `models` state signal after every slot or registry
 * change; each newer revision (and the current one, replayed to a late
 * window) re-reads the lists with `getModelsStatus` — in-memory, no disk
 * scan. Per-slot load statuses move onto the signal fabric in plan 0004
 * A8a; until then `statuses` holds the optimistic values set by `load` /
 * `unload`.
 *
 * Consumed by the Slot Orchestrator devtool, the Models page,
 * `CortexMemoryStrip` in chat, and `DevPulseDashboard`. The shape is
 * stable: `slots`, `models`, `statuses`, plus `scan` / `refresh` /
 * `load` / `unload` verbs that wrap the corresponding Tauri commands.
 */

import {
	assignModelToSlot as assignModelToSlotCmd,
	clearSlotAssignment as clearSlotAssignmentCmd,
	getModelsStatus,
	getSlots,
	loadSlot as loadSlotCmd,
	scanModels,
	unloadSlot as unloadSlotCmd,
} from "$lib/sys/bindings/models/index.js";
import { signalFabric } from "$lib/sys/events/signal-fabric.js";
import type { ModelInfo, SlotInfo } from "$lib/sys/generated/bindings.js";
import type { ModelLoadStatus } from "../util/types.js";

class ModelsState {
	slots = $state<SlotInfo[]>([]);
	/**
	 * Registry of every discovered model. Initial fill comes from a
	 * one-shot `scanModels()` at boot; afterwards every `models` state
	 * signal re-reads it from the loader so the UI never lags Rust.
	 */
	models = $state<ModelInfo[]>([]);
	statuses = $state<Record<string, ModelLoadStatus>>({});
	private booted = false;
	private platformReady = false;
	private listsStale = false;

	/**
	 * Follow Rust's `models` state (lists re-read on each newer revision).
	 * Called once at app boot via `bootstrapDownloadBridge()`.
	 */
	async boot(): Promise<void> {
		if (this.booted) return;
		this.booted = true;

		// Rust scans the models folder in the background at boot and
		// publishes `models` when done; the fabric replays the current value,
		// so the lists load without a mount-time scan racing boot. The scan
		// can finish before the platform answers queries, so a re-read waits
		// for Rust's `boot` state to reach ready.
		signalFabric.on("models", () => {
			this.listsStale = true;
			this.reloadWhenReady();
		});
		signalFabric.on("boot", (status) => {
			this.platformReady = status.phase === "ready";
			this.reloadWhenReady();
		});
	}

	private reloadWhenReady(): void {
		if (!this.platformReady || !this.listsStale) return;
		this.listsStale = false;
		void this.reload();
	}

	/** Re-read slots + registry from the loader's in-memory state (no disk scan). */
	async reload(): Promise<void> {
		const r = await getModelsStatus();
		if (r.status === "ok") {
			this.slots = r.data.slots;
			this.models = r.data.models;
		} else {
			console.error("modelsState.reload failed:", r.error);
		}
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
	 * Subsequent refreshes follow the `models` state signal (`reload`),
	 * which re-reads the registry the loader already holds
	 * — zero extra IO.
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
	 * loader lifecycle signals supersede it once they move onto the
	 * signal fabric (plan 0004 A8a).
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
	 * choice to its Turso kv store, validates capability compatibility,
	 * and publishes a newer `models` state on success — `reload` above
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
	 * Turso `slot.<id>.model` key so the next app launch does NOT
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
	 * loader lifecycle signals clear it once on the fabric (plan 0004 A8a).
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
