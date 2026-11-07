/**
 * Projects Store - Svelte 5 runes state management for projects
 */
import {
	listProjects,
	addProject,
	removeProject,
	selectProject,
	getSelectedProject,
	browseFolder,
	type Project
} from '$lib/api';

class ProjectsStore {
	projects = $state<Project[]>([]);
	selected = $state<Project | null>(null);
	loading = $state(false);
	error = $state<string | null>(null);

	/**
	 * Derived: Has projects?
	 */
	get hasProjects(): boolean {
		return this.projects.length > 0;
	}

	/**
	 * Derived: Project count
	 */
	get count(): number {
		return this.projects.length;
	}

	/**
	 * Load all projects from backend
	 */
	async load(): Promise<void> {
		this.loading = true;
		this.error = null;

		try {
			const [projectsResult, selectedResult] = await Promise.all([
				listProjects(),
				getSelectedProject()
			]);
			this.projects = projectsResult;
			this.selected = selectedResult;
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Add a project by path
	 */
	async add(path: string): Promise<Project | null> {
		this.loading = true;
		this.error = null;

		try {
			const project = await addProject(path);
			this.projects.push(project);
			return project;
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			return null;
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Remove a project by ID
	 */
	async remove(id: string): Promise<void> {
		this.loading = true;
		this.error = null;

		try {
			await removeProject(id);
			this.projects = this.projects.filter((p) => p.id !== id);
			if (this.selected?.id === id) {
				this.selected = null;
			}
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Select a project as active
	 */
	async select(id: string): Promise<void> {
		this.loading = true;
		this.error = null;

		try {
			await selectProject(id);
			this.selected = this.projects.find((p) => p.id === id) ?? null;
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Open folder picker and add project
	 */
	async browse(): Promise<Project | null> {
		try {
			const path = await browseFolder();
			if (path) {
				return this.add(path);
			}
			return null;
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			return null;
		}
	}
}

export const projectsStore = new ProjectsStore();
