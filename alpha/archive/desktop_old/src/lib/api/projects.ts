/**
 * Projects API - Tauri command wrappers for project management
 */
import { invoke } from '@tauri-apps/api/core';

export interface Project {
	id: string;
	name: string;
	path: string;
	created_at: number;
}

/**
 * List all registered projects
 */
export async function listProjects(): Promise<Project[]> {
	return invoke<Project[]>('list_projects');
}

/**
 * Add a new project by path
 */
export async function addProject(path: string): Promise<Project> {
	return invoke<Project>('add_project', { path });
}

/**
 * Remove a project by ID
 */
export async function removeProject(id: string): Promise<void> {
	return invoke<void>('remove_project', { id });
}

/**
 * Select a project as active
 */
export async function selectProject(id: string): Promise<void> {
	return invoke<void>('select_project', { id });
}

/**
 * Get the currently selected project
 */
export async function getSelectedProject(): Promise<Project | null> {
	return invoke<Project | null>('get_selected_project');
}

/**
 * Open native folder picker dialog
 */
export async function browseFolder(): Promise<string | null> {
	return invoke<string | null>('browse_folder');
}
