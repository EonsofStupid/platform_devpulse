/**
 * @file Models State Rune
 * @module @devpulse/domains/app/models/data-access/models
 *
 * Rust is the source of truth. This rune is a dumb bucket.
 *
 * Rust pushes `platform:models-status` events via `emit_status()`.
 * `startStatusListener()` receives the payload and sets `$state` directly.
 * Zero IPC polling. Zero `getSlots()`. Zero `scanModels()` for reads.
 *
 * The only IPC calls this module makes are COMMANDS:
 * assign, load, unload, swap, warm, scan, delete.
 * After each command succeeds, Rust pushes fresh state automatically.
 */

import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { withAction } from "$lib/sys/action-bus.svelte.js";
import type { ModelInfo, SlotInfo } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";
import type { ModelStatus } from "../util/models.types.js";
import {
	assignModelToSlot,
	loadSlot,
	scanModels,
	swapSlotModel,
	unloadSlot,
	warmSlot,
} from "./index.js";

// ── StatusUpdate envelope — matches Rust `commands::StatusUpdate<T>` ──

interface StatusUpdate<T> {
	kind: "data" | "info" | "error" | "crash";
	data: T;
}

interface ModelsStatusData {
	slots: SlotInfo[];
	models: ModelInfo[];
	firstRun: boolean;
}

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

	// ── Push Listener ───────────────────────────────────

	/**
	 * Listen for `platform:models-status` events pushed from Rust.
	 *
	 * Rust emits this at boot and after every mutation (assign, load,
	 * unload, swap, scan, delete, import, setup complete).
	 *
	 * The payload is `StatusUpdate<ModelsStatusData>`:
	 * - kind "data"  → full state snapshot, set $state directly
	 * - kind "error" → set error banner
	 * - kind "crash" → unrecoverable, surface hard
	 *
	 * This is the ONLY way model state enters the frontend.
	 */
	async startStatusListener(): Promise<void> {
		this.stopStatusListener();
		logInfo("models", "startStatusListener() — subscribing to platform:models-status");
		this.statusUnlisten = await listen<StatusUpdate<ModelsStatusData>>(
			"platform:models-status",
			(event) => {
				const { kind, data } = event.payload;

				if (kind === "data") {
					this.slots = data.slots;
					this.models = data.models;
					this.firstRun = data.firstRun;
					this.loading = false;
					this.error = null;

					// Initialize statuses for new slots
					data.slots.forEach((s) => {
						if (!this.statuses[s.id]) {
							this.statuses[s.id] = { type: "cold" };
						}
					});

					logInfo(
						"models",
						`platform:models-status [data] — slots=${data.slots.length} models=${data.models.length} firstRun=${data.firstRun}`,
					);
				} else if (kind === "error") {
					this.error = typeof data === "string" ? data : JSON.stringify(data);
					logError("models", `platform:models-status [error] — ${this.error}`);
				} else if (kind === "crash") {
					this.error = typeof data === "string" ? data : JSON.stringify(data);
					logError("models", `platform:models-status [crash] — ${this.error}`);
				}
			},
		);
	}

	/** Stop listening for platform:models-status. */
	stopStatusListener(): void {
		if (this.statusUnlisten) {
			this.statusUnlisten();
			this.statusUnlisten = null;
		}
	}

	// ── Commands (write operations — Rust pushes state after each) ──

	/**
	 * Request fresh state from Rust.
	 *
	 * Triggers a scan command — Rust re-scans the models directory
	 * and pushes fresh state via `platform:models-status`.
	 *
	 * For post-mutation calls (after assign/load/unload), this is
	 * redundant — Rust already pushed. But it's safe and harmless.
	 * For post-download or post-import, it picks up new files.
	 */
	async refresh(): Promise<void> {
		logInfo("models", "refresh() — triggering scan (state arrives via push)");
		await this.scan();
	}

	/**
	 * Trigger a model directory scan.
	 *
	 * This is a COMMAND — tells Rust to re-scan the models directory.
	 * Fresh state arrives via the status listener, not from the return value.
	 */
	async scan(): Promise<void> {
		return withAction("models.scan", "Scanning local models…", async () => {
			this.scanning = true;
			this.error = null;
			logInfo("models", "scan() start — scanModels()");
			try {
				const timeout = new Promise<never>((_, reject) =>
					setTimeout(
						() => reject(new Error("Model scan timed out after 60s — IPC response lost")),
						60_000,
					),
				);
				await Promise.race([scanModels(), timeout]);
				logInfo("models", "scan() IPC complete — state arrives via push");
			} catch (e) {
				const msg = e instanceof Error ? e.message : String(e);
				this.error = msg;
				logError("models", `scan() FAILED: ${msg}`);
				throw e;
			} finally {
				this.scanning = false;
			}
		});
	}

	/** Assign a model to a slot. Rust pushes fresh state after. */
	async assign(slotId: string, modelId: string): Promise<void> {
		return withAction("models.assign", "Assigning the model to your slot…", async () => {
			this.error = null;
			logInfo("models", `assign() start — slot=${slotId} modelId=${modelId}`);
			try {
				await assignModelToSlot(slotId, modelId);
				logInfo("models", `assign() complete — slot=${slotId} modelId=${modelId}`);
			} catch (e) {
				const msg = e instanceof Error ? e.message : String(e);
				this.error = msg;
				logError("models", `assign() FAILED — slot=${slotId} modelId=${modelId}: ${msg}`);
				throw e;
			}
		});
	}

	/** Warm a slot — load weights to CPU RAM only. Fast activation later. */
	async warm(slotId: string): Promise<void> {
		return withAction(
			"models.warm",
			"Warming weights into memory for faster activation…",
			async () => {
				logInfo("models", `warm() start — slot=${slotId}`);
				const { swapState } = await import("./swap.state.svelte.js");
				swapState.startLoad(slotId);
				this.statuses[slotId] = { type: "loading", stage: "loading_weights", progressPct: 0 };
				try {
					await warmSlot(slotId);
					this.statuses[slotId] = { type: "warm" };
					swapState.complete();
					logInfo("models", `warm() complete — slot=${slotId}`);
				} catch (e) {
					const msg = e instanceof Error ? e.message : String(e);
					this.statuses[slotId] = { type: "failed", error: msg };
					swapState.fail(msg);
					logError("models", `warm() FAILED — slot=${slotId}: ${msg}`);
					throw e;
				}
			},
		);
	}

	/** Load a slot's model. Activates SwapOverlay for full-screen block. */
	async load(slotId: string): Promise<void> {
		return withAction("models.load", "Loading the model into your GPU or CPU…", async () => {
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
		});
	}

	/** Unload a slot's model. Activates SwapOverlay. Hard fail — error surfaces. */
	async unload(slotId: string): Promise<void> {
		return withAction("models.unload", "Unloading the model to free memory…", async () => {
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
		});
	}

	/**
	 * Atomically swap the model on a loaded slot.
	 * Rust pushes fresh state after. SwapOverlay driven by Tauri events.
	 */
	async swap(slotId: string, newModelId: string): Promise<void> {
		return withAction("models.swap", "Swapping to a different model on this slot…", async () => {
			logInfo("models", `swap() start — slot=${slotId} newModelId=${newModelId}`);
			const { swapState } = await import("./swap.state.svelte.js");
			swapState.startLoad(slotId);
			this.error = null;
			try {
				await swapSlotModel(slotId, newModelId);
				logInfo("models", `swap() complete — slot=${slotId}`);
			} catch (e) {
				const msg = e instanceof Error ? e.message : String(e);
				this.error = msg;
				logError("models", `swap() FAILED — slot=${slotId} newModelId=${newModelId}: ${msg}`);
				throw e;
			}
		});
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
