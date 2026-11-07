// Models API - CRUD for model management

import { get, post } from './client';

// Types matching shared/src/types/models.rs SSOT
export type ModelFamily = 'qwen3_embed' | 'qwen3_rerank' | 'qwen3_vl' | 'whisper' | 'kokoro';

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

export interface VerifyResponse {
	id: string;
	available: boolean;
	message: string;
}

export interface SetActiveResponse {
	success: boolean;
	model_id: string;
	message: string;
}

// API functions
export function listModels(): Promise<ModelInfo[]> {
	return get('/api/models');
}

export function getSummary(): Promise<ModelSummary> {
	return get('/api/models/summary');
}

export function getModel(id: string): Promise<ModelInfo> {
	return get(`/api/models/${id}`);
}

export function verifyModel(id: string): Promise<VerifyResponse> {
	return get(`/api/models/${id}/verify`);
}

export function setActiveModel(modelId: string): Promise<SetActiveResponse> {
	return post('/api/models/active', { model_id: modelId });
}

export function listByFamily(family: string): Promise<ModelInfo[]> {
	return get(`/api/models/family/${family}`);
}
