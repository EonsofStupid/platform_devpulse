/**
 * Models Store - Svelte 5 runes state management for model selection
 */
import {
	listModels,
	getModelSummary,
	setActiveModel,
	getModelLoadStates,
	onModelLoading,
	loadVLModel,
	unloadVLModel,
	getCurrentVLModel,
	type ModelInfo,
	type ModelSummary,
	type ModelLoadState,
	type ModelLoadEvent
} from '$lib/api';

class ModelsStore {
	models = $state<ModelInfo[]>([]);
	summary = $state<ModelSummary | null>(null);
	loadStates = $state<Record<string, ModelLoadState>>({});
	loading = $state(false);
	loadingModelId = $state<string | null>(null);
	loadProgress = $state(0);
	loadStage = $state<string>('');
	error = $state<string | null>(null);
	/** Currently loaded VL model (in VRAM) */
	loadedVlModelId = $state<string | null>(null);

	private unlistenLoading: (() => void) | null = null;

	/**
	 * Derived: VL models only
	 */
	get vlModels(): ModelInfo[] {
		return this.models.filter((m) => m.family === 'qwen3_vl');
	}

	/**
	 * Derived: Active VL model
	 */
	get activeVlModel(): ModelInfo | null {
		return this.models.find((m) => m.family === 'qwen3_vl' && m.is_active) ?? null;
	}

	/**
	 * Derived: Embed models only
	 */
	get embedModels(): ModelInfo[] {
		return this.models.filter((m) => m.family === 'qwen3_embed');
	}

	/**
	 * Derived: Rerank models only
	 */
	get rerankModels(): ModelInfo[] {
		return this.models.filter((m) => m.family === 'qwen3_rerank');
	}

	/**
	 * Derived: Is loading a model?
	 */
	get isLoadingModel(): boolean {
		return this.loadingModelId !== null;
	}

	/**
	 * Derived: Available VL models (files exist)
	 */
	get availableVlModels(): ModelInfo[] {
		return this.vlModels.filter((m) => m.available);
	}

	/**
	 * Initialize store - subscribe to loading events
	 */
	async init(): Promise<void> {
		this.unlistenLoading = await onModelLoading((event) => {
			this.handleLoadEvent(event);
		});
		await this.load();
		await this.refreshLoadedVlModel();
	}

	/**
	 * Cleanup subscriptions
	 */
	destroy(): void {
		this.unlistenLoading?.();
		this.unlistenLoading = null;
	}

	/**
	 * Load all models from backend
	 */
	async load(): Promise<void> {
		this.loading = true;
		this.error = null;

		try {
			const [modelsResult, summaryResult, loadStatesResult] = await Promise.all([
				listModels(),
				getModelSummary(),
				getModelLoadStates()
			]);
			this.models = modelsResult;
			this.summary = summaryResult;
			this.loadStates = loadStatesResult;
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Switch to a different model
	 */
	async switchModel(id: string): Promise<boolean> {
		this.loadingModelId = id;
		this.loadProgress = 0;
		this.loadStage = 'starting';
		this.error = null;

		try {
			await setActiveModel(id);
			await this.load(); // Refresh state
			return true;
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			return false;
		} finally {
			this.loadingModelId = null;
		}
	}

	/**
	 * Handle loading event from backend
	 */
	private handleLoadEvent(event: ModelLoadEvent): void {
		this.loadProgress = event.progress_pct;
		this.loadStage = event.stage;

		if (event.error) {
			this.error = event.error;
		}

		if (event.stage === 'complete' || event.stage === 'error') {
			this.loadingModelId = null;
			this.load(); // Refresh state
		}
	}

	/**
	 * Get load state for a specific family
	 */
	getLoadState(family: string): ModelLoadState {
		return this.loadStates[family] ?? { state: 'idle' };
	}

	/**
	 * Derived: Is a VL model loaded in VRAM?
	 */
	get isVlModelLoaded(): boolean {
		return this.loadedVlModelId !== null;
	}

	/**
	 * Derived: Currently loaded VL model info
	 */
	get loadedVlModel(): ModelInfo | null {
		if (!this.loadedVlModelId) return null;
		return this.models.find((m) => m.id === this.loadedVlModelId) ?? null;
	}

	/**
	 * Load a VL model into VRAM
	 */
	async loadVlModel(modelId: string): Promise<boolean> {
		this.loadingModelId = modelId;
		this.loadProgress = 0;
		this.loadStage = 'loading';
		this.error = null;

		try {
			await loadVLModel(modelId);
			this.loadedVlModelId = modelId;
			await this.load(); // Refresh state
			return true;
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			return false;
		} finally {
			this.loadingModelId = null;
		}
	}

	/**
	 * Unload current VL model from VRAM
	 */
	async unloadVlModel(): Promise<void> {
		try {
			await unloadVLModel();
			this.loadedVlModelId = null;
			await this.load(); // Refresh state
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		}
	}

	/**
	 * Refresh loaded VL model ID from backend
	 */
	async refreshLoadedVlModel(): Promise<void> {
		try {
			this.loadedVlModelId = await getCurrentVLModel();
		} catch {
			this.loadedVlModelId = null;
		}
	}
}

export const modelsStore = new ModelsStore();
