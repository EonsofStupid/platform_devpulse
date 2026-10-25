// Models Store - Svelte 5 runes for model management

import * as api from '$lib/api/models';

class ModelsStore {
	models = $state<api.ModelInfo[]>([]);
	summary = $state<api.ModelSummary | null>(null);
	loading = $state(false);
	error = $state<string | null>(null);

	// Computed: grouped by family
	get vlModels() {
		return this.models.filter((m) => m.family === 'qwen3_vl');
	}

	get embedModels() {
		return this.models.filter((m) => m.family === 'qwen3_embed');
	}

	get rerankModels() {
		return this.models.filter((m) => m.family === 'qwen3_rerank');
	}

	get voiceModels() {
		return this.models.filter((m) => m.family === 'whisper' || m.family === 'kokoro');
	}

	get availableCount() {
		return this.models.filter((m) => m.available).length;
	}

	async loadAll() {
		this.loading = true;
		this.error = null;
		try {
			const [models, summary] = await Promise.all([api.listModels(), api.getSummary()]);
			this.models = models;
			this.summary = summary;
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to load models';
		} finally {
			this.loading = false;
		}
	}

	async setActive(modelId: string) {
		this.loading = true;
		this.error = null;
		try {
			await api.setActiveModel(modelId);
			// Refresh to get updated state
			await this.loadAll();
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to set active model';
			throw e;
		} finally {
			this.loading = false;
		}
	}

	async verify(modelId: string): Promise<boolean> {
		try {
			const result = await api.verifyModel(modelId);
			return result.available;
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to verify model';
			return false;
		}
	}
}

export const modelsStore = new ModelsStore();
