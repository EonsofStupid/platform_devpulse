// Persona API - CRUD for Maestro personas

import { get, post, del } from './client';

// Types matching shared/src/config/persona.rs SSOT
export interface ResponseStyle {
	verbosity: string;
	tone: string;
	include_examples: boolean;
	explain_reasoning: boolean;
}

export interface Persona {
	id: string;
	name: string;
	instructions: string;
	personality: string;
	style: ResponseStyle;
	is_active: boolean;
	is_default: boolean;
	created_at: number;
	updated_at: number;
}

export interface PersonaSummary {
	id: string;
	name: string;
	is_active: boolean;
	is_default: boolean;
}

export interface CreatePersonaRequest {
	name: string;
	instructions: string;
	personality?: string;
	style?: ResponseStyle;
}

export interface UpdatePersonaRequest {
	name?: string;
	instructions?: string;
	personality?: string;
	style?: ResponseStyle;
}

export interface SetActiveResponse {
	success: boolean;
	persona_id: string;
	persona_name: string;
}

export interface DeleteResponse {
	success: boolean;
	message: string;
}

export interface DefaultInstructionsResponse {
	instructions: string;
}

// API functions
export function listPersonas(): Promise<PersonaSummary[]> {
	return get('/api/persona');
}

export function getActivePersona(): Promise<Persona> {
	return get('/api/persona/active');
}

export function getPersona(id: string): Promise<Persona> {
	return get(`/api/persona/${id}`);
}

export function getDefaultInstructions(): Promise<DefaultInstructionsResponse> {
	return get('/api/persona/default-instructions');
}

export function createPersona(request: CreatePersonaRequest): Promise<Persona> {
	return post('/api/persona', request);
}

export function updatePersona(id: string, request: UpdatePersonaRequest): Promise<Persona> {
	// Use PUT via fetch directly since client.ts only has post
	return fetch(`http://localhost:3001/api/persona/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(request)
	}).then((res) => {
		if (!res.ok) throw new Error(`PUT /api/persona/${id} failed: ${res.status}`);
		return res.json();
	});
}

export function setActivePersona(personaId: string): Promise<SetActiveResponse> {
	return post('/api/persona/active', { persona_id: personaId });
}

export function deletePersona(id: string): Promise<DeleteResponse> {
	return del(`/api/persona/${id}`);
}
