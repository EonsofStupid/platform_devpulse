/**
 * @file Model loader panel controller state.
 * @module @devpulse/domains/app/models/data-access/model-loader-panel-state
 */

import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logWarn } from "$lib/sys/logger.js";
import { competencyTracker } from "./competency.service.js";
import { downloadModel, importLocalModel } from "./download.service.js";
import { hardwareState } from "./hardware.state.svelte.js";
import { modelsState } from "./models.state.svelte.js";
import { narrationState } from "./narration.state.svelte.js";
import { setupSessionState } from "./setup-session.state.svelte.js";
import { swapState } from "./swap.state.svelte.js";

export interface ModelLoaderHealthItem {
	name: string;
	status: string;
	latency_us: number | null;
}

class ModelLoaderPanelState {
	showSearch = $state(false);
	showImportSlotPicker = $state(false);
	advancedMode = $state(false);
	applying = $state(false);
	error = $state<string | null>(null);
	health = $state<ModelLoaderHealthItem[]>([]);
	private started = false;

	async start(): Promise<void> {
		if (this.started) {
			return;
		}

		this.started = true;
		hardwareState.startListening();
		void (async () => {
			await modelsState.startStatusListener();
			await modelsState.refresh();
		})();
		swapState.startListening();
		narrationState.startListening();
		competencyTracker.load();
		await this.loadHealth();
	}

	stop(): void {
		if (!this.started) {
			return;
		}

		this.started = false;
		hardwareState.stopListening();
		modelsState.stopStatusListener();
		swapState.stopListening();
		narrationState.stopListening();
	}

	async loadHealth(): Promise<void> {
		try {
			const result = await commands.getStatus();
			if (result.status === "ok" && result.data.subsystems) {
				this.health = result.data.subsystems.map((subsystem) => ({
					name: subsystem.name,
					status: subsystem.status,
					latency_us: subsystem.latency_us,
				}));
			}
		} catch (error) {
			logWarn(
				"models.panel",
				`Health check failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	toggleImportPicker(): void {
		this.showImportSlotPicker = !this.showImportSlotPicker;
	}

	closeImportPicker(): void {
		this.showImportSlotPicker = false;
	}

	toggleSearch(): void {
		this.showSearch = !this.showSearch;
	}

	closeSearch(): void {
		this.showSearch = false;
	}

	toggleAdvancedMode(): void {
		const nextValue = !this.advancedMode;
		this.advancedMode = nextValue;
		competencyTracker.setLevel(nextValue ? 2 : 0);
	}

	async importForSlot(slotId: string): Promise<void> {
		this.error = null;
		this.showImportSlotPicker = false;
		try {
			await importLocalModel(slotId);
			await modelsState.scan();
			await modelsState.refresh();
		} catch (error) {
			this.error = `Import failed: ${error instanceof Error ? error.message : String(error)}`;
		}
	}

	async searchDownload(repoId: string, filename: string): Promise<string> {
		this.error = null;
		try {
			return await downloadModel(repoId, filename);
		} catch (error) {
			this.error = `Download failed: ${error instanceof Error ? error.message : String(error)}`;
			throw error;
		}
	}

	async applyAndLaunch(onComplete?: () => void): Promise<void> {
		if (this.applying) {
			return;
		}

		this.error = null;
		this.applying = true;
		try {
			await setupSessionState.applyPendingSelections();

			const result = await commands.completeModelSetup();
			if (result.status === "error") {
				this.error = result.error;
				return;
			}

			onComplete?.();
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.error = message;
			logError("models.panel", `Apply and launch failed: ${message}`);
		} finally {
			this.applying = false;
		}
	}
}

export const modelLoaderPanelState = new ModelLoaderPanelState();
