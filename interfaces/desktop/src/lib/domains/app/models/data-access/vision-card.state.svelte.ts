/**
 * @file Vision card controller state.
 * @module @devpulse/domains/app/models/data-access/vision-card-state
 */

import type { ModelInfo } from "#lib/sys/generated/bindings.js";
import { slotDisplayStatus } from "../util/models.types.js";
import { getCatalogForSlot } from "./catalog.service.js";
import { cancelDownload, downloadModel, onDownloadProgress } from "./download.service.js";
import { modelsState } from "./models.state.svelte.js";
import { setupSessionState } from "./setup-session.state.svelte.js";

const SLOT_ID = "vision.embedder";

class VisionCardState {
	visionRepo = $state("");
	visionFile = $state("");
	visionSizeMb = $state(0);
	downloading = $state(false);
	downloadId = $state<string | null>(null);
	downloadPct = $state(0);
	downloadSpeedBps = $state(0);
	downloadEtaSecs = $state(-1);
	autoCapture = $state(true);
	screenshotQuality = $state<"standard" | "high">("standard");
	error = $state<string | null>(null);
	private catalogLoaded = false;

	async ensureCatalogLoaded(): Promise<void> {
		if (this.catalogLoaded) {
			return;
		}

		this.catalogLoaded = true;
		const entry = await getCatalogForSlot(SLOT_ID);
		if (entry && entry.options.length > 0) {
			const option = entry.options[0];
			this.visionRepo = option.repo;
			this.visionFile = option.file;
			this.visionSizeMb = option.size_mb;
		}
	}

	get slotId(): string {
		return SLOT_ID;
	}

	get visionStatus(): string {
		return slotDisplayStatus(
			modelsState.statuses[SLOT_ID],
			!!modelsState.slots.find((slot) => slot.id === SLOT_ID)?.assigned_model_id,
		);
	}

	get isLoaded(): boolean {
		return this.visionStatus === "active";
	}

	get hasModel(): boolean {
		return this.visionStatus !== "not_downloaded";
	}

	get slotCapability(): string {
		return modelsState.slots.find((slot) => slot.id === SLOT_ID)?.capability ?? "vision_embedding";
	}

	get modelStatus() {
		return modelsState.statuses[SLOT_ID];
	}

	get isTransitioning(): boolean {
		return this.modelStatus?.type === "loading" || this.modelStatus?.type === "unloading";
	}

	get brainHasVision(): boolean {
		const brainSlot = modelsState.slots.find((slot) => slot.id === "chat.brain");
		if (!brainSlot?.assigned_model_id) {
			return false;
		}

		const model = modelsState.models.find(
			(candidate) => candidate.id === brainSlot.assigned_model_id,
		);
		if (!model) {
			return false;
		}

		const vlmPatterns = ["phi-4-multimodal", "qwen3-vl", "qwen3.5"];
		return vlmPatterns.some((pattern) => model.filename.toLowerCase().includes(pattern));
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

	selectModel(modelId: string): void {
		this.error = null;
		setupSessionState.selectModel(SLOT_ID, modelId);
	}

	async handleDownload(): Promise<void> {
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
			const downloadId = await downloadModel(this.visionRepo, this.visionFile);
			this.downloadId = downloadId;
			this.downloadPct = 100;
			await modelsState.scan();
			await modelsState.refresh();
			const model = modelsState.models.find((candidate) => candidate.filename === this.visionFile);
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
			this.error = `Activation failed: ${error instanceof Error ? error.message : String(error)}`;
		}
	}

	async handleUnload(): Promise<void> {
		this.error = null;
		try {
			await modelsState.unload(SLOT_ID);
		} catch (error) {
			this.error = `Deactivation failed: ${error instanceof Error ? error.message : String(error)}`;
		}
	}
}

export const visionCardState = new VisionCardState();
