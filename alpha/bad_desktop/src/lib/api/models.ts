/**
 * Models API - Tauri command wrappers for model management
 */
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

export type ModelFamily = 'qwen3_vl' | 'qwen3_embed' | 'qwen3_rerank' | 'whisper' | 'kokoro';

export interface ModelInfo {
	id: string;
	name: string;
	family: ModelFamily;
	params_b: number;
	quantization: string | null;
	vram_gb: number;
	available: boolean;
	is_active: boolean;
}

export interface ModelSummary {
	active_vl: string | null;
	active_embed: string | null;
	active_rerank: string | null;
	total_models: number;
	missing_count: number;
}

export type ModelLoadState =
	| { state: 'idle' }
	| { state: 'loading'; progress_pct: number; stage: string }
	| { state: 'loaded'; vram_mb: number; latency_ms: number }
	| { state: 'failed'; error: string };

export interface ModelLoadEvent {
	model_id: string;
	stage: 'starting' | 'verifying' | 'loading' | 'complete' | 'error';
	progress_pct: number;
	error: string | null;
}

/**
 * List all available models
 */
export async function listModels(): Promise<ModelInfo[]> {
	return invoke<ModelInfo[]>('list_models');
}

/**
 * List models by family
 */
export async function listModelsByFamily(family: ModelFamily | string): Promise<ModelInfo[]> {
	return invoke<ModelInfo[]>('list_models_by_family', { family });
}

/**
 * Get model summary
 */
export async function getModelSummary(): Promise<ModelSummary> {
	return invoke<ModelSummary>('get_model_summary');
}

/**
 * Set active model (with persistence)
 */
export async function setActiveModel(id: string): Promise<void> {
	return invoke<void>('set_active_model', { id });
}

/**
 * Get current load states for all model families
 */
export async function getModelLoadStates(): Promise<Record<string, ModelLoadState>> {
	return invoke<Record<string, ModelLoadState>>('get_model_load_states');
}

/**
 * Listen for model loading events
 * Returns an unlisten function to clean up the subscription
 */
export async function onModelLoading(
	callback: (event: ModelLoadEvent) => void
): Promise<UnlistenFn> {
	return listen<ModelLoadEvent>('model-loading', (event) => {
		callback(event.payload);
	});
}

/**
 * Load a VL model into VRAM
 * This actually loads the model weights (4B or 8B)
 */
export async function loadVLModel(modelId: string): Promise<void> {
	return invoke<void>('load_vl_model', { modelId });
}

/**
 * Unload current VL model from VRAM
 */
export async function unloadVLModel(): Promise<void> {
	return invoke<void>('unload_vl_model');
}

/**
 * Get currently loaded VL model ID
 */
export async function getCurrentVLModel(): Promise<string | null> {
	return invoke<string | null>('get_current_vl_model');
}
