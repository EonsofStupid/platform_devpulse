/**
 * @file Memory card controller state.
 * @module @devpulse/domains/app/models/data-access/memory-card-state
 */

import type { ModelInfo } from "#lib/sys/generated/bindings.js";
import { slotDisplayStatus } from "../util/models.types.js";
import { getCatalogForSlot } from "./catalog.service.js";
import { cancelDownload, downloadModel, onDownloadProgress } from "./download.service.js";
import { modelsState } from "./models.state.svelte.js";
import { setupSessionState } from "./setup-session.state.svelte.js";

const EMBEDDER_SLOT = "rag.embedder";
const RERANKER_SLOT = "rag.reranker";

class MemoryCardState {
	embedRepo = $state("");
	embedFile = $state("");
	embedSizeMb = $state(0);
	rerankRepo = $state("");
	rerankFile = $state("");
	rerankSizeMb = $state(0);
	downloadingEmbed = $state(false);
	downloadingRerank = $state(false);
	embedDownloadId = $state<string | null>(null);
	rerankDownloadId = $state<string | null>(null);
	embedPct = $state(0);
	rerankPct = $state(0);
	embedSpeedBps = $state(0);
	rerankSpeedBps = $state(0);
	embedEtaSecs = $state(-1);
	rerankEtaSecs = $state(-1);
	memoryDepth = $state(5);
	error = $state<string | null>(null);
	private catalogLoaded = false;

	private readonly depthLabels: Record<number, string> = {
		1: "Minimal - remembers very little",
		3: "Light - recent conversations",
		5: "Balanced - good memory (default)",
		7: "Deep - extensive recall",
		10: "Maximum - remembers everything",
	};

	async ensureCatalogLoaded(): Promise<void> {
		if (this.catalogLoaded) {
			return;
		}

		this.catalogLoaded = true;
		const [embedEntry, rerankEntry] = await Promise.all([
			getCatalogForSlot(EMBEDDER_SLOT),
			getCatalogForSlot(RERANKER_SLOT),
		]);

		if (embedEntry && embedEntry.options.length > 0) {
			this.embedRepo = embedEntry.options[0].repo;
			this.embedFile = embedEntry.options[0].file;
			this.embedSizeMb = embedEntry.options[0].size_mb;
		}

		if (rerankEntry && rerankEntry.options.length > 0) {
			this.rerankRepo = rerankEntry.options[0].repo;
			this.rerankFile = rerankEntry.options[0].file;
			this.rerankSizeMb = rerankEntry.options[0].size_mb;
		}
	}

	get embedderSlotId(): string {
		return EMBEDDER_SLOT;
	}

	get rerankerSlotId(): string {
		return RERANKER_SLOT;
	}

	get embedStatus(): string {
		return slotDisplayStatus(
			modelsState.statuses[EMBEDDER_SLOT],
			!!modelsState.slots.find((slot) => slot.id === EMBEDDER_SLOT)?.assigned_model_id,
		);
	}

	get rerankStatus(): string {
		return slotDisplayStatus(
			modelsState.statuses[RERANKER_SLOT],
			!!modelsState.slots.find((slot) => slot.id === RERANKER_SLOT)?.assigned_model_id,
		);
	}

	get memoryReady(): boolean {
		return (
			(this.embedStatus === "active" || this.embedStatus === "downloaded") &&
			(this.rerankStatus === "active" || this.rerankStatus === "downloaded")
		);
	}

	get bothInstalled(): boolean {
		return this.embedStatus !== "not_downloaded" && this.rerankStatus !== "not_downloaded";
	}

	get embedCapability(): string {
		return modelsState.slots.find((slot) => slot.id === EMBEDDER_SLOT)?.capability ?? "embedding";
	}

	get rerankCapability(): string {
		return modelsState.slots.find((slot) => slot.id === RERANKER_SLOT)?.capability ?? "reranking";
	}

	get embedModelStatus() {
		return modelsState.statuses[EMBEDDER_SLOT];
	}

	get rerankModelStatus() {
		return modelsState.statuses[RERANKER_SLOT];
	}

	get embedTransitioning(): boolean {
		return this.embedModelStatus?.type === "loading" || this.embedModelStatus?.type === "unloading";
	}

	get rerankTransitioning(): boolean {
		return (
			this.rerankModelStatus?.type === "loading" || this.rerankModelStatus?.type === "unloading"
		);
	}

	get embedModels(): ModelInfo[] {
		return modelsState.modelsForCapability(this.embedCapability);
	}

	get rerankModels(): ModelInfo[] {
		return modelsState.modelsForCapability(this.rerankCapability);
	}

	get depthLabel(): string {
		return this.depthLabels[this.memoryDepth] ?? `Custom depth: ${this.memoryDepth}`;
	}

	committedModelId(slotId: string): string | null {
		return setupSessionState.committedModelId(slotId);
	}

	pendingModelId(slotId: string): string | null {
		return setupSessionState.pendingModelId(slotId);
	}

	selectedModelId(slotId: string): string | null {
		return setupSessionState.selectedModelId(slotId);
	}

	selectModel(slotId: string, modelId: string): void {
		this.error = null;
		setupSessionState.selectModel(slotId, modelId);
	}

	async handleDownloadEmbed(): Promise<void> {
		this.error = null;
		this.downloadingEmbed = true;
		this.embedPct = 0;
		this.embedSpeedBps = 0;
		this.embedEtaSecs = -1;

		const unsubProgress = onDownloadProgress((progress) => {
			if (progress.totalBytes > 0) {
				this.embedPct = Math.min(
					99,
					Math.round((progress.bytesDownloaded / progress.totalBytes) * 100),
				);
			}
			this.embedSpeedBps = progress.speedBps;
			this.embedEtaSecs = progress.etaSecs;
			if (!this.embedDownloadId && progress.downloadId) {
				this.embedDownloadId = progress.downloadId;
			}
		});

		try {
			const downloadId = await downloadModel(this.embedRepo, this.embedFile);
			this.embedDownloadId = downloadId;
			this.embedPct = 100;
			await modelsState.scan();
			await modelsState.refresh();
			const model = modelsState.models.find((candidate) => candidate.filename === this.embedFile);
			if (model) {
				this.selectModel(EMBEDDER_SLOT, model.id);
			}
		} catch (error) {
			this.error = `Download failed: ${error instanceof Error ? error.message : String(error)}`;
		} finally {
			this.downloadingEmbed = false;
			this.embedDownloadId = null;
			unsubProgress();
		}
	}

	async handleCancelEmbed(): Promise<void> {
		if (!this.embedDownloadId) {
			return;
		}

		try {
			await cancelDownload(this.embedDownloadId);
			this.downloadingEmbed = false;
			this.embedDownloadId = null;
			this.embedPct = 0;
		} catch (error) {
			this.error = `Cancel failed: ${error instanceof Error ? error.message : String(error)}`;
		}
	}

	async handleDownloadRerank(): Promise<void> {
		this.error = null;
		this.downloadingRerank = true;
		this.rerankPct = 0;
		this.rerankSpeedBps = 0;
		this.rerankEtaSecs = -1;

		const unsubProgress = onDownloadProgress((progress) => {
			if (progress.totalBytes > 0) {
				this.rerankPct = Math.min(
					99,
					Math.round((progress.bytesDownloaded / progress.totalBytes) * 100),
				);
			}
			this.rerankSpeedBps = progress.speedBps;
			this.rerankEtaSecs = progress.etaSecs;
			if (!this.rerankDownloadId && progress.downloadId) {
				this.rerankDownloadId = progress.downloadId;
			}
		});

		try {
			const downloadId = await downloadModel(this.rerankRepo, this.rerankFile);
			this.rerankDownloadId = downloadId;
			this.rerankPct = 100;
			await modelsState.scan();
			await modelsState.refresh();
			const model = modelsState.models.find((candidate) => candidate.filename === this.rerankFile);
			if (model) {
				this.selectModel(RERANKER_SLOT, model.id);
			}
		} catch (error) {
			this.error = `Download failed: ${error instanceof Error ? error.message : String(error)}`;
		} finally {
			this.downloadingRerank = false;
			this.rerankDownloadId = null;
			unsubProgress();
		}
	}

	async handleCancelRerank(): Promise<void> {
		if (!this.rerankDownloadId) {
			return;
		}

		try {
			await cancelDownload(this.rerankDownloadId);
			this.downloadingRerank = false;
			this.rerankDownloadId = null;
			this.rerankPct = 0;
		} catch (error) {
			this.error = `Cancel failed: ${error instanceof Error ? error.message : String(error)}`;
		}
	}

	async handleDownloadAll(): Promise<void> {
		if (this.embedStatus === "not_downloaded") {
			await this.handleDownloadEmbed();
		}

		if (this.rerankStatus === "not_downloaded") {
			await this.handleDownloadRerank();
		}
	}
}

export const memoryCardState = new MemoryCardState();
