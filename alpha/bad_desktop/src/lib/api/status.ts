/**
 * Status API - Tauri command wrappers for system status
 */
import { invoke } from '@tauri-apps/api/core';

export interface StatusInfo {
	ai_ready: boolean;
	voice_ready: boolean;
	projects_count: number;
	sessions_count: number;
	active_adapter: string;
}

export interface AdapterInfo {
	kind: string;
	name: string;
	is_available: boolean;
	requires_api_key: boolean;
}

// Component load states
export type LoadState =
	| 'NotLoaded'
	| 'Loading'
	| 'Loaded'
	| 'Skipped'
	| { Failed: { error: string } };

export interface ComponentStatus {
	name: string;
	state: LoadState;
	memory_mb: number;
	device: string | null;
	load_time_ms: number | null;
	last_used: string | null;
	details: string | null;
}

export interface SystemStatusSnapshot {
	uptime_secs: number;
	embedder: ComponentStatus;
	reranker: ComponentStatus;
	llm: ComponentStatus;
	voice_tts: ComponentStatus;
	voice_stt: ComponentStatus;
	rro: ComponentStatus;
	database: ComponentStatus;
	analytics: ComponentStatus;
}

/**
 * Get current engine status
 */
export async function getStatus(): Promise<StatusInfo> {
	return invoke<StatusInfo>('get_status');
}

/**
 * Get list of available adapters
 */
export async function getAdapters(): Promise<AdapterInfo[]> {
	return invoke<AdapterInfo[]>('get_adapters');
}

/**
 * Set the active adapter
 */
export async function setAdapter(kind: string): Promise<void> {
	return invoke<void>('set_adapter', { kind });
}

/**
 * Get detailed system status (all components)
 */
export async function getSystemStatus(): Promise<SystemStatusSnapshot> {
	return invoke<SystemStatusSnapshot>('get_system_status');
}
