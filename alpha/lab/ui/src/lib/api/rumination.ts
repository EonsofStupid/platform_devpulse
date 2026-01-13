// Rumination API - Thought tree and layers

import { get } from './client';

export interface RuminationState {
	active: boolean;
	current_layer: string | null;
	layers: LayerState[];
	tree_id: string | null;
}

export interface LayerState {
	name: string;
	active: boolean;
	thoughts_count: number;
	latency_ms: number | null;
}

export interface ThoughtNode {
	id: string;
	parent_id: string | null;
	content: string;
	source: string;
	score: number;
	children: ThoughtNode[];
	timestamp: string;
}

export interface ThoughtTree {
	id: string;
	root: ThoughtNode | null;
	selected_path: string[];
	total_nodes: number;
}

export async function getState(): Promise<RuminationState> {
	return get('/api/rumination/state');
}

export async function getTree(): Promise<ThoughtTree | null> {
	return get('/api/rumination/tree');
}

export async function getLayers(): Promise<LayerState[]> {
	return get('/api/rumination/layers');
}
