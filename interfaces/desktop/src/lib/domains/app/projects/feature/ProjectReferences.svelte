<!--
	@file ProjectReferences.svelte
	@domain app/projects/feature

	Lists read-only reference directories linked to the currently-active
	project, with add + remove. "Reference" = a directory whose contents
	the user wants available for context / search / indexing but isn't
	the active project itself.

	Relies on `projectsState.activeProject` — if no project is active,
	renders an empty-state directing the user to the switcher.
-->
<script lang="ts">
import { FileText, Folder, FolderPlus, Layers, Trash2 } from "@lucide/svelte";
import { invoke } from "@tauri-apps/api/core";
import { logError } from "$lib/sys/logger.js";
import { projectsState, type ReferenceKind } from "../data-access/projects.state.svelte.js";

let pickingRef = $state(false);
let selectedKind = $state<ReferenceKind>("other");

const KINDS: { value: ReferenceKind; label: string; icon: typeof Folder }[] = [
	{ value: "docs", label: "Docs", icon: FileText },
	{ value: "source", label: "Source", icon: Layers },
	{ value: "examples", label: "Examples", icon: Folder },
	{ value: "other", label: "Other", icon: Folder },
];

async function handleAdd(): Promise<void> {
	if (pickingRef || !projectsState.activeProject) return;
	pickingRef = true;
	try {
		const path = await invoke<string>("pick_directory", {
			title: "Pick reference directory",
		});
		if (!path) return;
		const label = path.split(/[/\\]/).filter(Boolean).pop() ?? null;
		await projectsState.addReference(path, label, selectedKind);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		if (!msg.toLowerCase().includes("cancel") && msg !== "No folder selected") {
			logError("projects.references", `add failed — ${msg}`);
		}
	} finally {
		pickingRef = false;
	}
}

async function handleRemove(id: string): Promise<void> {
	await projectsState.removeReference(id);
}

function kindIcon(kind: string): typeof Folder {
	return KINDS.find((k) => k.value === kind)?.icon ?? Folder;
}
</script>

<div class="project-references">
	<div class="pr-header">
		<h3 class="pr-title">Reference Directories</h3>
		{#if projectsState.activeProject}
			<div class="pr-add">
				<select bind:value={selectedKind} class="pr-kind">
					{#each KINDS as kind (kind.value)}
						<option value={kind.value}>{kind.label}</option>
					{/each}
				</select>
				<button
					type="button"
					class="pr-add-btn"
					onclick={handleAdd}
					disabled={pickingRef}
				>
					<FolderPlus size={14} />
					{pickingRef ? "Picking…" : "Add reference"}
				</button>
			</div>
		{/if}
	</div>

	{#if !projectsState.activeProject}
		<p class="pr-empty">Set an active project to link reference directories.</p>
	{:else if projectsState.activeProjectReferences.length === 0}
		<p class="pr-empty">
			No references yet. Click "Add reference" to link read-only directories
			to <strong>{projectsState.activeProject.name}</strong>.
		</p>
	{:else}
		<ul class="pr-list">
			{#each projectsState.activeProjectReferences as ref (ref.id)}
				{@const Icon = kindIcon(ref.kind)}
				<li class="pr-item">
					<span class="pr-icon" data-kind={ref.kind}>
						<Icon size={14} />
					</span>
					<span class="pr-main">
						<span class="pr-label">{ref.label ?? ref.path}</span>
						<span class="pr-path">{ref.path}</span>
					</span>
					<span class="pr-kind-badge">{ref.kind}</span>
					<button
						type="button"
						class="pr-remove"
						onclick={() => handleRemove(ref.id)}
						aria-label="Remove reference"
					>
						<Trash2 size={14} />
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.project-references {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		border: 0.0625rem solid var(--border-soft);
		border-radius: 0.5rem;
		background: color-mix(in oklch, var(--surface-glass-deep) 55%, transparent);
	}
	.pr-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.pr-title {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--accent-teal-main);
	}
	.pr-add {
		display: flex;
		gap: 0.25rem;
	}
	.pr-kind {
		padding: 0.25rem 0.5rem;
		border: 0.0625rem solid var(--border-soft);
		border-radius: 0.375rem;
		background: transparent;
		color: var(--text-primary);
		font-size: 0.75rem;
	}
	.pr-add-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		border: 0.0625rem solid color-mix(in oklch, var(--accent-teal-main) 30%, var(--border-soft));
		border-radius: 0.375rem;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 0.75rem;
	}
	.pr-add-btn:hover:not(:disabled) {
		border-color: var(--accent-teal-main);
		color: var(--text-primary);
	}
	.pr-add-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.pr-empty {
		margin: 0;
		padding: 0.5rem 0.25rem;
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-style: italic;
	}

	.pr-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.pr-item {
		display: grid;
		grid-template-columns: auto 1fr auto auto;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		background: color-mix(in oklch, var(--surface-base) 60%, transparent);
	}
	.pr-item:hover {
		background: color-mix(in oklch, var(--accent-teal-main) 8%, var(--surface-base));
	}
	.pr-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.25rem;
		color: var(--text-secondary);
	}
	.pr-icon[data-kind="docs"] {
		color: var(--accent-blue-main, var(--accent-teal-main));
	}
	.pr-icon[data-kind="source"] {
		color: var(--accent-violet-main, var(--accent-purple-main));
	}
	.pr-icon[data-kind="examples"] {
		color: var(--accent-gold-main, var(--accent-warning));
	}
	.pr-main {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.pr-label {
		color: var(--text-primary);
		font-weight: 500;
		font-size: 0.8125rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.pr-path {
		color: var(--text-muted);
		font-size: 0.6875rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.pr-kind-badge {
		padding: 0.125rem 0.375rem;
		border-radius: 9999rem;
		border: 0.0625rem solid var(--border-soft);
		color: var(--text-muted);
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.pr-remove {
		padding: 0.25rem;
		border: none;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		border-radius: 0.25rem;
	}
	.pr-remove:hover {
		color: var(--signal-error);
		background: color-mix(in oklch, var(--signal-error) 12%, transparent);
	}
</style>
