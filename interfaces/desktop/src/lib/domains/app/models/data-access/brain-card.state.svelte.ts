/**
 * @file Brain card controller state.
 * @module @devpulse/domains/app/models/data-access/brain-card-state
 */

import type { CatalogOption, ModelInfo } from "#lib/sys/generated/bindings.js";
import { getCatalogForSlot } from "./catalog.service.js";
import { cancelDownload, downloadModel, onDownloadProgress } from "./download.service.js";
import { modelsState } from "./models.state.svelte.js";
import { setupSessionState } from "./setup-session.state.svelte.js";

const SLOT_ID = "chat.brain";

class BrainCardState {
	catalogOptions = $state<CatalogOption[]>([]);
	catalogLabel = $state("Clyffy's Brain");
	catalogDescription = $state("Main reasoning model for chat");
	selectedIdx = $state(0);
	downloading = $state(false);
	downloadId = $state<string | null>(null);
	downloadPct = $state(0);
	downloadSpeedBps = $state(0);
	downloadEtaSecs = $state(-1);
	error = $state<string | null>(null);
	private catalogLoaded = false;

	async ensureCatalogLoaded(): Promise<void> {
		if (this.catalogLoaded) {
			return;
		}

		this.catalogLoaded = true;
		const entry = await getCatalogForSlot(SLOT_ID);
		if (!entry) {
			return;
		}

		this.catalogLabel = entry.label;
		this.catalogDescription = entry.description;
		this.catalogOptions = entry.options;
	}

	get slotId(): string {
		return SLOT_ID;
	}

	get opt(): CatalogOption {
		return (
			this.catalogOptions[this.selectedIdx] ?? {
				label: "",
				repo: "",
				file: "",
				size_mb: 0,
				is_dir: false,
			}
		);
	}

	get brainStatus(): string {
		const rawStatus = modelsState.statuses[SLOT_ID];
		const hasAssignedModel = !!modelsState.slots.find((slot) => slot.id === SLOT_ID)
			?.assigned_model_id;

		if (!hasAssignedModel) {
			return "not_downloaded";
		}

		if (!rawStatus) {
			return "ready";
		}

		if (rawStatus.type === "hot") {
			return "active";
		}

		if (rawStatus.type === "warm") {
			return "warm";
		}

		return "ready";
	}

	get isLoaded(): boolean {
		return this.brainStatus === "active";
	}

	get hasModel(): boolean {
		return this.brainStatus !== "not_downloaded";
	}

	get slotCapability(): string {
		return modelsState.slots.find((slot) => slot.id === SLOT_ID)?.capability ?? "text_generation";
	}

	get modelStatus() {
		return modelsState.statuses[SLOT_ID];
	}

	get isTransitioning(): boolean {
		return this.modelStatus?.type === "loading" || this.modelStatus?.type === "unloading";
	}

	get isWarm(): boolean {
		return this.modelStatus?.type === "warm";
	}

	get compatibleModels(): ModelInfo[] {
		return modelsState.modelsForCapability(this.slotCapability);
	}

	get committedModelId(): string | null {
		return setupSessionState.committedModelId(SLOT_ID);
	}

	get pendingModelId(): string | null {
		return setupSessionState.pendingModelId(SLOT_ID);
	}

	get selectedModelId(): string | null {
		return setupSessionState.selectedModelId(SLOT_ID);
	}

	get selectedModel(): ModelInfo | null {
		return this.compatibleModels.find((model) => model.id === this.selectedModelId) ?? null;
	}

	get pendingModel(): ModelInfo | null {
		return this.compatibleModels.find((model) => model.id === this.pendingModelId) ?? null;
	}

	get isDirty(): boolean {
		return setupSessionState.isDirty(SLOT_ID);
	}

	selectCatalogIndex(index: number): void {
		this.selectedIdx = index;
	}

	selectModel(modelId: string): void {
		this.error = null;
		setupSessionState.selectModel(SLOT_ID, modelId);
	}

	async handleDownload(): Promise<void> {
		if (!this.opt.repo) {
			return;
		}

		this.error = null;
		this.downloading = true;
		this.downloadPct = 0;
		this.downloadSpeedBps = 0;
		this.downloadEtaSecs = -1;

		const unsubProgress = onDownloadProgress((progress) => {
			if (progress.totalBytes > 0) {
				this.downloadPct = Math.min(
					99,
					Math.round((progress.bytesDownloaded / progress.totalBytes) * 100),
				);
			}
			this.downloadSpeedBps = progress.speedBps;
			this.downloadEtaSecs = progress.etaSecs;
			if (!this.downloadId && progress.downloadId) {
				this.downloadId = progress.downloadId;
			}
		});

		try {
			const downloadId = await downloadModel(this.opt.repo, this.opt.file);
			this.downloadId = downloadId;
			this.downloadPct = 100;
			await modelsState.scan();
			await modelsState.refresh();
			const model = modelsState.models.find((candidate) => candidate.filename === this.opt.file);
			if (model) {
				this.selectModel(model.id);
			}
		} catch (error) {
			this.error = `Download failed: ${error instanceof Error ? error.message : String(error)}`;
		} finally {
			this.downloading = false;
			this.downloadId = null;
			unsubProgress();
		}
	}

	async handleCancelDownload(): Promise<void> {
		if (!this.downloadId) {
			return;
		}

		try {
			await cancelDownload(this.downloadId);
			this.downloading = false;
			this.downloadId = null;
			this.downloadPct = 0;
		} catch (error) {
			this.error = `Cancel failed: ${error instanceof Error ? error.message : String(error)}`;
		}
	}

	async handleLoad(): Promise<void> {
		this.error = null;
		try {
			await modelsState.load(SLOT_ID);
		} catch (error) {
			this.error = `Load failed: ${error instanceof Error ? error.message : String(error)}`;
		}
	}

	async handleUnload(): Promise<void> {
		this.error = null;
		try {
			await modelsState.unload(SLOT_ID);
		} catch (error) {
			this.error = `Unload failed: ${error instanceof Error ? error.message : String(error)}`;
		}
	}

	async handleWarm(): Promise<void> {
		this.error = null;
		try {
			await modelsState.warm(SLOT_ID);
		} catch (error) {
			this.error = `Warm failed: ${error instanceof Error ? error.message : String(error)}`;
		}
	}

	async handleSwap(): Promise<void> {
		const model = modelsState.models.find((candidate) => candidate.filename === this.opt.file);
		if (!model) {
			this.error = `Download "${this.opt.label}" first before switching.`;
			return;
		}

		this.error = null;
		try {
			await modelsState.swap(SLOT_ID, model.id);
		} catch (error) {
			this.error = `Switch failed: ${error instanceof Error ? error.message : String(error)}`;
		}
	}
}

export const brainCardState = new BrainCardState();
