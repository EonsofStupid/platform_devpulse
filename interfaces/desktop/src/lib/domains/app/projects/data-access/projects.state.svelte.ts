/**
 * @file Projects state — rune module backing the project switcher,
 * references panel, and any surface that needs to know "what am I
 * working on right now".
 * @module @devpulse/domains/app/projects/data-access
 *
 * There is exactly ONE active project at a time (enforced by the
 * backend — `active_project_id` is a singleton in `kv_store`). This
 * module mirrors that singleton as `$state`, plus a list of all
 * projects and the currently-active project's references.
 *
 * Commands are called via tauri-specta generated bindings under
 * `commands.*` — they write Turso first (authoritative) and mirror
 * to SurrealDB. This state reloads from Turso after every mutation
 * so the UI reflects the ground truth, not our in-memory guess.
 */

import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";

export interface Project {
	id: string;
	name: string;
	rootPath: string;
	projectType: string;
	slug: string | null;
	description: string | null;
	tool: string | null;
	techStack: string | null;
	active: boolean;
	createdAt: number;
}

export interface ProjectReference {
	id: string;
	projectId: string;
	path: string;
	label: string | null;
	kind: string;
	createdAt: number;
}

export type ReferenceKind = "docs" | "source" | "examples" | "other";

const LOG_TARGET = "domains.projects";

class ProjectsState {
	projects = $state<Project[]>([]);
	activeProjectId = $state<string | null>(null);
	activeProjectReferences = $state<ProjectReference[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);

	activeProject = $derived(
		this.activeProjectId
			? (this.projects.find((p) => p.id === this.activeProjectId) ?? null)
			: null,
	);

	/** Load all projects + the active-project singleton + its references. */
	async refresh(reason = "manual"): Promise<void> {
		if (this.loading) return;
		this.loading = true;
		this.error = null;
		logInfo(LOG_TARGET, `refresh() — reason=${reason}`);
		try {
			const [list, active] = await Promise.all([
				commands.listProjects(false),
				commands.getActiveProject(),
			]);
			this.projects = (list as unknown as Project[]) ?? [];
			this.activeProjectId = active ? (active as unknown as Project).id : null;

			if (this.activeProjectId) {
				const refs = await commands.listProjectReferences(this.activeProjectId);
				this.activeProjectReferences = (refs as unknown as ProjectReference[]) ?? [];
			} else {
				this.activeProjectReferences = [];
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.error = msg;
			logError(LOG_TARGET, `refresh() failed — ${msg}`);
		} finally {
			this.loading = false;
		}
	}

	/** Create a project and optionally set it active in one call. */
	async createProject(input: {
		name: string;
		rootPath: string;
		description?: string | null;
		setActive?: boolean;
	}): Promise<Project | null> {
		logInfo(LOG_TARGET, `createProject(${input.name}, active=${input.setActive ?? false})`);
		try {
			const created = await commands.createProject({
				name: input.name,
				root_path: input.rootPath,
				project_type: "personal",
				description: input.description ?? null,
				tool: null,
				tech_stack: null,
				set_active: input.setActive ?? false,
			});
			await this.refresh("after-create");
			return created as unknown as Project;
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.error = msg;
			logError(LOG_TARGET, `createProject() failed — ${msg}`);
			return null;
		}
	}

	async setActive(id: string): Promise<void> {
		try {
			await commands.setActiveProject(id);
			await this.refresh("after-set-active");
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.error = msg;
			logError(LOG_TARGET, `setActive(${id}) failed — ${msg}`);
		}
	}

	async clearActive(): Promise<void> {
		try {
			await commands.clearActiveProject();
			await this.refresh("after-clear-active");
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			logError(LOG_TARGET, `clearActive() failed — ${msg}`);
		}
	}

	async addReference(path: string, label: string | null, kind: ReferenceKind): Promise<void> {
		if (!this.activeProjectId) {
			this.error = "no active project — set one before adding references";
			return;
		}
		try {
			await commands.addProjectReference({
				project_id: this.activeProjectId,
				path,
				label,
				kind,
			});
			await this.refresh("after-add-ref");
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.error = msg;
			logError(LOG_TARGET, `addReference(${path}) failed — ${msg}`);
		}
	}

	async removeReference(id: string): Promise<void> {
		try {
			await commands.removeProjectReference(id);
			await this.refresh("after-remove-ref");
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			logError(LOG_TARGET, `removeReference(${id}) failed — ${msg}`);
		}
	}
}

export const projectsState = new ProjectsState();
