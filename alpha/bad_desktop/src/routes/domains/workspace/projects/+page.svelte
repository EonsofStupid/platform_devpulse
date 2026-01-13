<script lang="ts">
	import { invoke } from '@tauri-apps/api/core';

	interface Project {
		id: string;
		name: string;
		path: string;
		project_type: string;
		created_at: string;
	}

	let projects = $state<Project[]>([]);
	let loading = $state(true);
	let showAddForm = $state(false);
	let newProjectPath = $state('');
	let adding = $state(false);

	async function loadProjects() {
		loading = true;
		try {
			projects = await invoke<Project[]>('list_projects');
		} catch (e) {
			console.error('Failed to load projects:', e);
		} finally {
			loading = false;
		}
	}

	async function addProject() {
		if (!newProjectPath.trim() || adding) return;
		adding = true;
		try {
			await invoke('add_project', { path: newProjectPath.trim() });
			newProjectPath = '';
			showAddForm = false;
			await loadProjects();
		} catch (e) {
			alert('Failed to add project: ' + e);
		} finally {
			adding = false;
		}
	}

	async function selectProject(id: string) {
		try {
			await invoke('select_project', { id });
			// Navigate to chat
			window.location.href = '/';
		} catch (e) {
			alert('Failed to select project: ' + e);
		}
	}

	async function browseFolder() {
		try {
			const path = await invoke<string | null>('browse_folder');
			if (path) {
				newProjectPath = path;
			}
		} catch (e) {
			console.error('Browse failed:', e);
		}
	}

	// Load on mount
	$effect(() => {
		loadProjects();
	});
</script>

<div class="projects-container">
	<header class="projects-header">
		<h1>Projects</h1>
		<button onclick={() => showAddForm = !showAddForm}>
			{showAddForm ? 'Cancel' : 'Add Project'}
		</button>
	</header>

	{#if showAddForm}
		<div class="add-form card">
			<h3>Add Project</h3>
			<div class="form-row">
				<input
					type="text"
					bind:value={newProjectPath}
					placeholder="Project path..."
					class="path-input"
				/>
				<button onclick={browseFolder} class="browse-btn">Browse</button>
			</div>
			<button onclick={addProject} disabled={adding || !newProjectPath.trim()}>
				{adding ? 'Adding...' : 'Add'}
			</button>
		</div>
	{/if}

	<div class="projects-list">
		{#if loading}
			<div class="loading">Loading projects...</div>
		{:else if projects.length === 0}
			<div class="empty-state">
				<p>No projects yet</p>
				<p class="hint">Add a project folder to get started</p>
			</div>
		{:else}
			{#each projects as project}
				<button class="project-card card" onclick={() => selectProject(project.id)}>
					<div class="project-info">
						<h3>{project.name}</h3>
						<span class="project-path">{project.path}</span>
					</div>
					<span class="project-type">{project.project_type}</span>
				</button>
			{/each}
		{/if}
	</div>
</div>

<style>
	.projects-container {
		padding: 1rem;
	}

	.projects-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.projects-header h1 {
		font-size: 1.25rem;
	}

	.add-form {
		margin-bottom: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.add-form h3 {
		font-size: 1rem;
		margin-bottom: 0.5rem;
	}

	.form-row {
		display: flex;
		gap: 0.5rem;
	}

	.path-input {
		flex: 1;
	}

	.browse-btn {
		background: var(--bg-tertiary);
	}

	.projects-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.project-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		text-align: left;
		background: var(--bg-secondary);
		width: 100%;
	}

	.project-card:hover {
		background: var(--bg-tertiary);
	}

	.project-info h3 {
		font-size: 1rem;
		margin-bottom: 0.25rem;
	}

	.project-path {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.project-type {
		background: var(--accent);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
	}

	.loading, .empty-state {
		text-align: center;
		padding: 2rem;
		color: var(--text-secondary);
	}

	.hint {
		font-size: 0.75rem;
		opacity: 0.7;
	}
</style>
