/**
 * @file projectsState — your projects and the active one, as Rust publishes them.
 * @module @devpulse/domains/app/projects/data-access/projects.state
 *
 * The list and the active project arrive as the `projects` state signal,
 * replayed to late windows — so the hub, the chat window and DevForge all
 * see the same active project. Intents go to Rust, which validates them,
 * writes to Turso and publishes the new state; nothing here decides which
 * project is active, and nothing re-reads by hand. A refusal keeps Rust's
 * message in `error`. The active project's reference directories load
 * whenever the active project changes.
 */

import { signalFabric } from "$lib/sys/events/signal-fabric.js";
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
	/** Until Rust's first `projects` state arrives. */
	loading = $state(true);
	error = $state<string | null>(null);

	activeProject = $derived(
		this.activeProjectId
			? (this.projects.find((p) => p.id === this.activeProjectId) ?? null)
			: null,
	);

	private offs: (() => void)[] = [];
	private referencesOf: string | null = null;
	/**
	 * Rust publishes the projects state while the platform is still booting;
	 * commands answer only once boot is ready, so references wait for it.
	 */
	private platformReady = $state(false);

	/** The projects state has arrived and the platform answers commands. */
	get ready(): boolean {
		return this.platformReady && !this.loading;
	}

	/** Follow the `projects` and `boot` signals. Returns the teardown. */
	start(): () => void {
		if (this.offs.length === 0) {
			this.offs = [
				signalFabric.on("boot", (status) => {
					const ready = status.phase === "ready";
					if (ready === this.platformReady) return;
					this.platformReady = ready;
					if (ready) void this.loadReferences();
				}),
				signalFabric.on("projects", (state) => {
					this.projects = state.projects;
					this.activeProjectId = state.activeId;
					this.loading = false;
					void this.loadReferences();
				}),
			];
		}
		return () => {
			this.offs.forEach((off) => {
				off();
			});
			this.offs = [];
		};
	}

	/** The active project's references; re-read when it changes, or when asked after an edit. */
	private async loadReferences(force = false): Promise<void> {
		if (!this.platformReady) return;
		const id = this.activeProjectId;
		if (!force && id === this.referencesOf) return;
		this.referencesOf = id;
		if (!id) {
			this.activeProjectReferences = [];
			return;
		}
		try {
			const references = unwrap("listProjectReferences", await commands.listProjectReferences(id));
			if (this.activeProjectId === id) this.activeProjectReferences = references;
		} catch (e) {
			this.error = message(e);
			logError(LOG_TARGET, `references of ${id} failed — ${this.error}`);
		}
	}

	/** Send one intent; the new state arrives on the signal. */
	private async run<T>(name: string, intent: () => Promise<Result<T, string>>): Promise<T | null> {
		this.error = null;
		try {
			return unwrap(name, await intent());
		} catch (e) {
			this.error = message(e);
			logError(LOG_TARGET, `${name} failed — ${this.error}`);
			return null;
		}
	}

	/** Register a folder as a project; `setActive` makes it the one you work in. */
	createProject = (input: {
		name: string;
		rootPath: string;
		description?: string | null;
		setActive?: boolean;
	}): Promise<Project | null> => {
		logInfo(LOG_TARGET, `createProject(${input.name}, active=${input.setActive ?? false})`);
		return this.run("createProject", () =>
			commands.createProject({
				name: input.name,
				root_path: input.rootPath,
				project_type: "personal",
				description: input.description ?? null,
				tool: null,
				tech_stack: null,
				set_active: input.setActive ?? false,
			}),
		);
	};

	setActive = async (id: string): Promise<void> => {
		await this.run("setActiveProject", () => commands.setActiveProject(id));
	};

	clearActive = async (): Promise<void> => {
		await this.run("clearActiveProject", () => commands.clearActiveProject());
	};

	/** Remove a project; its folder can be added again later. */
	remove = async (id: string): Promise<void> => {
		await this.run("deleteProject", () => commands.deleteProject(id));
	};

	addReference = async (path: string, label: string | null, kind: ReferenceKind): Promise<void> => {
		const projectId = this.activeProjectId;
		if (!projectId) {
			this.error = "no active project — set one before adding references";
			return;
		}
		const added = await this.run("addProjectReference", () =>
			commands.addProjectReference({ project_id: projectId, path, label, kind }),
		);
		if (added) await this.loadReferences(true);
	};

	removeReference = async (id: string): Promise<void> => {
		const removed = await this.run("removeProjectReference", () =>
			commands.removeProjectReference(id),
		);
		if (removed !== null) await this.loadReferences(true);
	};
}

export const projectsState = new ProjectsState();
