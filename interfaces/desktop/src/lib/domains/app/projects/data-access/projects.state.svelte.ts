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
 * Every command returns a `Result`; it is unwrapped here and a refusal
 * keeps Rust's message in `error`. Types are the generated ones (the
 * shape Rust actually sends). The state reloads from Turso after every
 * change so the UI shows what is stored, not a guess.
 */

import type { Project, ProjectReference, Result } from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";

export type { Project, ProjectReference };

export type ReferenceKind = "docs" | "source" | "examples" | "other";

const LOG_TARGET = "domains.projects";

function unwrap<T>(name: string, result: Result<T, string>): T {
	if (result.status === "error") throw new Error(`${name}: ${result.error}`);
	return result.data;
}

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

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
			this.projects = unwrap("listProjects", list);
			this.activeProjectId = unwrap("getActiveProject", active)?.id ?? null;
			this.activeProjectReferences = this.activeProjectId
				? unwrap(
						"listProjectReferences",
						await commands.listProjectReferences(this.activeProjectId),
					)
				: [];
		} catch (e) {
			this.error = message(e);
			logError(LOG_TARGET, `refresh() failed — ${this.error}`);
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
			const created = unwrap(
				"createProject",
				await commands.createProject({
					name: input.name,
					root_path: input.rootPath,
					project_type: "personal",
					description: input.description ?? null,
					tool: null,
					tech_stack: null,
					set_active: input.setActive ?? false,
				}),
			);
			await this.refresh("after-create");
			return created;
		} catch (e) {
			this.error = message(e);
			logError(LOG_TARGET, `createProject() failed — ${this.error}`);
			return null;
		}
	}

	async setActive(id: string): Promise<void> {
		try {
			unwrap("setActiveProject", await commands.setActiveProject(id));
			await this.refresh("after-set-active");
		} catch (e) {
			this.error = message(e);
			logError(LOG_TARGET, `setActive(${id}) failed — ${this.error}`);
		}
	}

	async clearActive(): Promise<void> {
		try {
			unwrap("clearActiveProject", await commands.clearActiveProject());
			await this.refresh("after-clear-active");
		} catch (e) {
			this.error = message(e);
			logError(LOG_TARGET, `clearActive() failed — ${this.error}`);
		}
	}

	async addReference(path: string, label: string | null, kind: ReferenceKind): Promise<void> {
		if (!this.activeProjectId) {
			this.error = "no active project — set one before adding references";
			return;
		}
		try {
			unwrap(
				"addProjectReference",
				await commands.addProjectReference({
					project_id: this.activeProjectId,
					path,
					label,
					kind,
				}),
			);
			await this.refresh("after-add-ref");
		} catch (e) {
			this.error = message(e);
			logError(LOG_TARGET, `addReference(${path}) failed — ${this.error}`);
		}
	}

	async removeReference(id: string): Promise<void> {
		try {
			unwrap("removeProjectReference", await commands.removeProjectReference(id));
			await this.refresh("after-remove-ref");
		} catch (e) {
			this.error = message(e);
			logError(LOG_TARGET, `removeReference(${id}) failed — ${this.error}`);
		}
	}
}

export const projectsState = new ProjectsState();
