/**
 * @file Voice card controller state.
 * @module @devpulse/domains/app/models/data-access/voice-card-state
 */

import type { ModelInfo } from "#lib/sys/generated/bindings.js";
import { slotDisplayStatus } from "../util/models.types.js";
import { getCatalogForSlot } from "./catalog.service.js";
import { cancelDownload, downloadModel, onDownloadProgress } from "./download.service.js";
import { modelsState } from "./models.state.svelte.js";
import { setupSessionState } from "./setup-session.state.svelte.js";

const STT_SLOT = "voice.stt";
const TTS_SLOT = "voice.tts";

class VoiceCardState {
	sttRepo = $state("");
	sttFile = $state("");
	sttSizeMb = $state(0);
	ttsRepo = $state("");
	ttsFile = $state("");
	ttsSizeMb = $state(0);
	downloadingStt = $state(false);
	downloadingTts = $state(false);
	sttDownloadId = $state<string | null>(null);
	ttsDownloadId = $state<string | null>(null);
	sttPct = $state(0);
	ttsPct = $state(0);
	sttSpeedBps = $state(0);
	ttsSpeedBps = $state(0);
	sttEtaSecs = $state(-1);
	ttsEtaSecs = $state(-1);
	pushToTalk = $state(false);
	voiceStyle = $state<"default" | "casual" | "focused">("default");
	error = $state<string | null>(null);
	private catalogLoaded = false;

	async ensureCatalogLoaded(): Promise<void> {
		if (this.catalogLoaded) {
			return;
		}

		this.catalogLoaded = true;
		const [sttEntry, ttsEntry] = await Promise.all([
			getCatalogForSlot(STT_SLOT),
			getCatalogForSlot(TTS_SLOT),
		]);

		if (sttEntry && sttEntry.options.length > 0) {
			this.sttRepo = sttEntry.options[0].repo;
			this.sttFile = sttEntry.options[0].file;
			this.sttSizeMb = sttEntry.options[0].size_mb;
		}

		if (ttsEntry && ttsEntry.options.length > 0) {
			this.ttsRepo = ttsEntry.options[0].repo;
			this.ttsFile = ttsEntry.options[0].file;
			this.ttsSizeMb = ttsEntry.options[0].size_mb;
		}
	}

	get sttSlotId(): string {
		return STT_SLOT;
	}

	get ttsSlotId(): string {
		return TTS_SLOT;
	}

	get sttStatus(): string {
		return slotDisplayStatus(
			modelsState.statuses[STT_SLOT],
			!!modelsState.slots.find((slot) => slot.id === STT_SLOT)?.assigned_model_id,
		);
	}

	get ttsStatus(): string {
		return slotDisplayStatus(
			modelsState.statuses[TTS_SLOT],
			!!modelsState.slots.find((slot) => slot.id === TTS_SLOT)?.assigned_model_id,
		);
	}

	get sttReady(): boolean {
		return this.sttStatus === "active" || this.sttStatus === "downloaded";
	}

	get ttsReady(): boolean {
		return this.ttsStatus === "active" || this.ttsStatus === "downloaded";
	}

	get voiceReady(): boolean {
		return this.sttReady && this.ttsReady;
	}

	get sttCapability(): string {
		return modelsState.slots.find((slot) => slot.id === STT_SLOT)?.capability ?? "speech_to_text";
	}

	get ttsCapability(): string {
		return modelsState.slots.find((slot) => slot.id === TTS_SLOT)?.capability ?? "text_to_speech";
	}

	get sttModelStatus() {
		return modelsState.statuses[STT_SLOT];
	}

	get ttsModelStatus() {
		return modelsState.statuses[TTS_SLOT];
	}

	get sttTransitioning(): boolean {
		return this.sttModelStatus?.type === "loading" || this.sttModelStatus?.type === "unloading";
	}

	get ttsTransitioning(): boolean {
		return this.ttsModelStatus?.type === "loading" || this.ttsModelStatus?.type === "unloading";
	}

	get sttModels(): ModelInfo[] {
		return modelsState.modelsForCapability(this.sttCapability);
	}

	get ttsModels(): ModelInfo[] {
		return modelsState.modelsForCapability(this.ttsCapability);
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

	async handleDownloadStt(): Promise<void> {
		this.error = null;
		this.downloadingStt = true;
		this.sttPct = 0;
		this.sttSpeedBps = 0;
		this.sttEtaSecs = -1;

		const unsubProgress = onDownloadProgress((progress) => {
			if (progress.totalBytes > 0) {
				this.sttPct = Math.min(
					99,
					Math.round((progress.bytesDownloaded / progress.totalBytes) * 100),
				);
			}
			this.sttSpeedBps = progress.speedBps;
			this.sttEtaSecs = progress.etaSecs;
			if (!this.sttDownloadId && progress.downloadId) {
				this.sttDownloadId = progress.downloadId;
			}
		});

		try {
			const downloadId = await downloadModel(this.sttRepo, this.sttFile);
			this.sttDownloadId = downloadId;
			this.sttPct = 100;
			await modelsState.scan();
			await modelsState.refresh();
			const model = modelsState.models.find((candidate) => candidate.filename === this.sttFile);
			if (model) {
				this.selectModel(STT_SLOT, model.id);
			}
		} catch (error) {
			this.error = `Download failed: ${error instanceof Error ? error.message : String(error)}`;
		} finally {
			this.downloadingStt = false;
			this.sttDownloadId = null;
			unsubProgress();
		}
	}

	async handleCancelStt(): Promise<void> {
		if (!this.sttDownloadId) {
			return;
		}

		try {
			await cancelDownload(this.sttDownloadId);
			this.downloadingStt = false;
			this.sttDownloadId = null;
			this.sttPct = 0;
		} catch (error) {
			this.error = `Cancel failed: ${error instanceof Error ? error.message : String(error)}`;
		}
	}

	async handleDownloadTts(): Promise<void> {
		this.error = null;
		this.downloadingTts = true;
		this.ttsPct = 0;
		this.ttsSpeedBps = 0;
		this.ttsEtaSecs = -1;

		const unsubProgress = onDownloadProgress((progress) => {
			if (progress.totalBytes > 0) {
				this.ttsPct = Math.min(
					99,
					Math.round((progress.bytesDownloaded / progress.totalBytes) * 100),
				);
			}
			this.ttsSpeedBps = progress.speedBps;
			this.ttsEtaSecs = progress.etaSecs;
			if (!this.ttsDownloadId && progress.downloadId) {
				this.ttsDownloadId = progress.downloadId;
			}
		});

		try {
			const downloadId = await downloadModel(this.ttsRepo, this.ttsFile);
			this.ttsDownloadId = downloadId;
			this.ttsPct = 100;
			await modelsState.scan();
			await modelsState.refresh();
			const model = modelsState.models.find((candidate) => candidate.filename === this.ttsFile);
			if (model) {
				this.selectModel(TTS_SLOT, model.id);
			}
		} catch (error) {
			this.error = `Download failed: ${error instanceof Error ? error.message : String(error)}`;
		} finally {
			this.downloadingTts = false;
			this.ttsDownloadId = null;
			unsubProgress();
		}
	}

	async handleCancelTts(): Promise<void> {
		if (!this.ttsDownloadId) {
			return;
		}

		try {
			await cancelDownload(this.ttsDownloadId);
			this.downloadingTts = false;
			this.ttsDownloadId = null;
			this.ttsPct = 0;
		} catch (error) {
			this.error = `Cancel failed: ${error instanceof Error ? error.message : String(error)}`;
		}
	}
}

export const voiceCardState = new VoiceCardState();
