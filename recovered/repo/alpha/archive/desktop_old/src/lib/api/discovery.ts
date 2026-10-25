/**
 * Discovery API - Adapter-based model discovery
 *
 * Scan ANY folder for GGUF models.
 * Works like Ollama/LM Studio - location doesn't matter.
 */
import { invoke } from '@tauri-apps/api/core';

export interface DiscoveredModel {
	id: string;
	name: string;
	path: string;
	mmproj_path: string | null;
	params_b: number | null;
	quantization: string | null;
	family: string | null;
	is_vl: boolean;
	vram_gb: number;
	size_human: string;
}

/**
 * Scan a directory for GGUF models (one-off, doesn't save path)
 */
export async function scanModels(path: string): Promise<DiscoveredModel[]> {
	return invoke<DiscoveredModel[]>('scan_models', { path });
}

/**
 * Set model directory and refresh discovery
 * This saves the path and returns discovered models
 */
export async function setModelDirectory(path: string): Promise<DiscoveredModel[]> {
	return invoke<DiscoveredModel[]>('set_model_directory', { path });
}

/**
 * Get discovered models (cached, fast)
 */
export async function getDiscoveredModels(): Promise<DiscoveredModel[]> {
	return invoke<DiscoveredModel[]>('get_discovered_models');
}

/**
 * Get VL (vision-language) models only
 */
export async function getVLModels(): Promise<DiscoveredModel[]> {
	return invoke<DiscoveredModel[]>('get_vl_models');
}

/**
 * Select a discovered model for use
 */
export async function selectDiscoveredModel(id: string): Promise<DiscoveredModel> {
	return invoke<DiscoveredModel>('select_discovered_model', { id });
}

/**
 * Get currently selected model
 */
export async function getSelectedModel(): Promise<DiscoveredModel | null> {
	return invoke<DiscoveredModel | null>('get_selected_model');
}
