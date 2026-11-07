// Analytics API - DuckDB metrics for Lab dashboard

import { get } from './client';

export interface InferenceStats {
	total_inferences: u64;
	avg_latency_ms: number;
	p99_latency_ms: number;
	total_tokens_in: u64;
	total_tokens_out: u64;
}

export interface HopStats {
	total_hops: u64;
	by_type: Record<string, u64>;
}

export interface FullAnalytics {
	inference: InferenceStats;
	hops: HopStats;
	event_count: u64;
}

export interface EventCountResponse {
	count: u64;
}

// TypeScript doesn't have u64, use number
type u64 = number;

export async function getSummary(): Promise<FullAnalytics> {
	return get('/api/analytics/summary');
}

export async function getInferenceStats(): Promise<InferenceStats> {
	return get('/api/analytics/inference');
}

export async function getHopStats(): Promise<HopStats> {
	return get('/api/analytics/hops');
}

export async function getEventCount(): Promise<EventCountResponse> {
	return get('/api/analytics/count');
}
