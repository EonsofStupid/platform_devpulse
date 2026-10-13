<!--
	@file ProjectSwitcher.svelte
	@domain app/projects/feature

	Singleton project picker — shows the currently-active project,
	lets the user switch between existing projects, and exposes the
	"Open in DevForge" action for the active project's root path.

	Single source of truth is the `projectsState` rune module; this
	component reads `activeProject`, `projects`, and emits command
	calls on click. Every mutation triggers a refresh from Turso so
	the UI never drifts from the backend SSOT.
-->
<script lang="ts">
import { Check, ChevronDown, FolderOpen, Plus } from "lucide-svelte";
import { onMount } from "svelte";
import { pickDirectory } from "$lib/sys/bindings/models/index.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";
import { projectsState } from "../data-access/projects.state.svelte.js";

let open = $state(false);
let opening = $state(false);
let creating = $state(false);

// One-shot load on mount. `onMount` runs exactly once after mount and
// does NOT re-track reactive reads — `$effect` would: the synchronous
// head of `refresh()` reads `this.loading` then writes it, which makes
// `$effect` re-fire every time `loading` flips → runaway loop (saw 1000+
// invocations per session in the 2026-04-28 console).
onMount(() => {
	void projectsState.refresh("switcher-mount");
});

async function handleSelect(id: string): Promise<void> {
	open = false;
	await projectsState.setActive(id);
}

async function handleCreate(): Promise<void> {
	if (creating) return;
	creating = true;
	try {
		const picked = await pickDirectory("Pick project folder");
		if (picked.status === "error") throw new Error(picked.error);
		const path = picked.data;
		if (!path) return;
		const name = path.split(/[/\\]/).filter(Boolean).pop() ?? path;
		const created = await projectsState.createProject({
			name,
			rootPath: path,
			setActive: true,
		});
		if (created) {
			logInfo("projects.switcher", `created + activated ${created.name}`);
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		if (!msg.toLowerCase().includes("cancel") && msg !== "No folder selected") {
			logError("projects.switcher", `create failed — ${msg}`);
		}
	} finally {
		creating = false;
		open = false;
	}
}

async function handleOpenInDevForge(): Promise<void> {
	if (opening || !projectsState.activeProject) return;
	opening = true;
	try {
		await commands.openDevforgeWindow(projectsState.activeProject.root_path);
		logInfo("projects.switcher", `DevForge opened at ${projectsState.activeProject.root_path}`);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("projects.switcher", `DevForge open failed — ${msg}`);
	} finally {
		opening = false;
	}
}
</script>

<div class="project-switcher" class:is-open={open}>
	<button
		type="button"
		class="ps-trigger"
		onclick={() => {
			open = !open;
		}}
		aria-haspopup="listbox"
		aria-expanded={open}
	>
		<span class="ps-label">
			{#if projectsState.loading}
				Loading…
			{:else if projectsState.activeProject}
				<span class="ps-name">{projectsState.activeProject.name}</span>
				<span class="ps-path">{projectsState.activeProject.root_path}</span>
			{:else}
				<span class="ps-empty">No active project</span>
			{/if}
		</span>
		<ChevronDown size={14} class="ps-chev" />
	</button>

	{#if open}
		<div class="ps-menu" role="listbox">
			{#if projectsState.projects.length === 0}
				<div class="ps-empty-row">No projects yet — create one to get started.</div>
			{:else}
				{#each projectsState.projects as project (project.id)}
					<button
						type="button"
						class="ps-row"
						class:active={project.id === projectsState.activeProjectId}
						onclick={() => handleSelect(project.id)}
					>
						<span class="ps-row-left">
							{#if project.id === projectsState.activeProjectId}
								<Check size={14} />
							{:else}
								<span class="ps-check-placeholder"></span>
							{/if}
							<span class="ps-row-name">{project.name}</span>
						</span>
						<span class="ps-row-path">{project.root_path}</span>
					</button>
				{/each}
			{/if}

			<div class="ps-actions">
				<button
					type="button"
					class="ps-action"
					onclick={handleCreate}
					disabled={creating}
				>
					<Plus size={14} />
					{creating ? "Creating…" : "New project"}
				</button>
				<button
					type="button"
					class="ps-action"
					onclick={handleOpenInDevForge}
					disabled={opening || !projectsState.activeProject}
				>
					<FolderOpen size={14} />
					{opening ? "Opening…" : "Open in DevForge"}
				</button>
			</div>
		</div>
	{/if}

	{#if projectsState.error}
		<div class="ps-error" role="alert">{projectsState.error}</div>
	{/if}
</div>

<style>
	.project-switcher {
		position: relative;
		display: inline-flex;
		flex-direction: column;
		min-width: 16rem;
	}
	.ps-trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.375rem 0.625rem;
		border: 0.0625rem solid color-mix(in oklch, var(--accent-teal-main) 20%, var(--border-soft));
		border-radius: 0.5rem;
		background: color-mix(in oklch, var(--surface-glass-deep) 70%, transparent);
		color: var(--text-primary);
		cursor: pointer;
		text-align: left;
		width: 100%;
	}
	.ps-trigger:hover {
		border-color: var(--accent-teal-main);
	}
	.ps-label {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.ps-name {
		font-weight: 600;
		color: var(--accent-teal-main);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.ps-path {
		font-size: 0.75rem;
		color: var(--text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.ps-empty {
		color: var(--text-muted);
		font-style: italic;
	}
	:global(.ps-chev) {
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.ps-menu {
		position: absolute;
		top: calc(100% + 0.25rem);
		left: 0;
		right: 0;
		z-index: 60;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.375rem;
		border: 0.0625rem solid var(--border-soft);
		border-radius: 0.5rem;
		background: var(--surface-base);
		backdrop-filter: blur(0.375rem);
		box-shadow: 0 0.5rem 1.5rem oklch(0 0 0 / 0.35);
	}
	.ps-empty-row {
		padding: 0.5rem 0.75rem;
		color: var(--text-muted);
		font-size: 0.875rem;
		font-style: italic;
	}
	.ps-row {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.375rem 0.5rem;
		border: none;
		border-radius: 0.375rem;
		background: transparent;
		color: var(--text-primary);
		cursor: pointer;
		text-align: left;
	}
	.ps-row:hover {
		background: color-mix(in oklch, var(--accent-teal-main) 12%, transparent);
	}
	.ps-row.active {
		background: color-mix(in oklch, var(--accent-teal-main) 18%, transparent);
		border: 0.0625rem solid color-mix(in oklch, var(--accent-teal-main) 40%, transparent);
	}
	.ps-row-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.ps-check-placeholder {
		display: inline-block;
		width: 0.875rem;
	}
	.ps-row-name {
		font-weight: 500;
	}
	.ps-row-path {
		margin-left: 1.375rem;
		font-size: 0.75rem;
		color: var(--text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ps-actions {
		display: flex;
		gap: 0.25rem;
		padding-top: 0.375rem;
		margin-top: 0.25rem;
		border-top: 0.0625rem solid var(--border-soft);
	}
	.ps-action {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
		border: 0.0625rem solid var(--border-soft);
		border-radius: 0.375rem;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 0.8125rem;
		flex: 1;
		justify-content: center;
	}
	.ps-action:hover:not(:disabled) {
		border-color: var(--accent-teal-main);
		color: var(--text-primary);
	}
	.ps-action:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.ps-error {
		margin-top: 0.25rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		background: color-mix(in oklch, var(--signal-error) 15%, transparent);
		color: var(--signal-error);
		font-size: 0.75rem;
	}
</style>
