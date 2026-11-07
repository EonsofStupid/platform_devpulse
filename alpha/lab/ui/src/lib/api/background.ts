// Background API - System status, models, and diagnostics

import { get } from './client';

// =============================================================================
// NEW: System Status Types (from /api/background/system)
// =============================================================================

export type LoadState = 'not_loaded' | 'loading' | 'loaded' | 'failed' | 'skipped';

export interface ComponentInfo {
	id: string;
	name: string;
	status: LoadState;
	memory_mb: number;
	device: string | null;
	load_time_ms: number | null;
	error: string | null;
}

export interface SystemStatus {
	uptime_secs: number;
	health: 'healthy' | 'degraded' | 'loading' | 'error';
	total_vram_mb: number;
	total_ram_mb: number;
	components: ComponentInfo[];
}

// =============================================================================
// LEGACY: Backward-compatible types
// =============================================================================

export interface BackgroundStatus {
	processes: ProcessStatus[];
	storage_sync: StorageSyncStatus;
}

export interface ProcessStatus {
	id: string;
	name: string;
	status: string;
	last_run: string | null;
	cpu_percent: number;
	memory_mb: number;
}

export interface StorageSyncStatus {
	hot_count: number;
	warm_count: number;
	cold_count: number;
	sync_rate_per_sec: number;
}

export interface Minion {
	name: string;
	active: boolean;
	signals_pending: number;
	last_signal: string | null;
	health: string;
}

export interface ModelInfo {
	name: string;
	loaded: boolean;
	status: LoadState;
	memory_mb: number;
	device: string | null;
	load_time_ms: number | null;
	error: string | null;
}

export interface ModelsResponse {
	embedder: ModelInfo;
	reranker: ModelInfo;
	llm: ModelInfo;
	voice_tts: ModelInfo;
	voice_stt: ModelInfo;
}

// =============================================================================
// API Functions
// =============================================================================

/** Fetch real system status (new endpoint) */
export async function getSystemStatus(): Promise<SystemStatus> {
	return get('/api/background/system');
}

/** Fetch legacy status (backward-compatible) */
export async function getStatus(): Promise<BackgroundStatus> {
	return get('/api/background/status');
}

/** Fetch minion status */
export async function getMinions(): Promise<Minion[]> {
	return get('/api/background/minions');
}

/** Fetch model status */
export async function getModels(): Promise<ModelsResponse> {
	return get('/api/background/models');
}

// =============================================================================
// Helper Functions
// =============================================================================

/** Convert ModelsResponse to array format */
export function modelsToArray(response: ModelsResponse): ModelInfo[] {
	return [
		{ ...response.embedder },
		{ ...response.reranker },
		{ ...response.llm },
		{ ...response.voice_tts },
		{ ...response.voice_stt }
	];
}

/** Get status badge class based on load state */
export function getStatusBadgeClass(status: LoadState): string {
	switch (status) {
		case 'loaded':
			return 'badge-success';
		case 'loading':
			return 'badge-inference';
		case 'failed':
			return 'badge-error';
		case 'skipped':
			return 'badge-thought';
		default:
			return 'badge-system';
	}
}

/** Format bytes as human readable */
export function formatMemory(mb: number): string {
	if (mb >= 1024) {
		return `${(mb / 1024).toFixed(1)} GB`;
	}
	return `${mb} MB`;
}

/** Format load time */
export function formatLoadTime(ms: number | null): string {
	if (ms === null) return '-';
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(1)}s`;
}
