<script lang="ts">
	import { projectsStore } from '$lib/stores';
	import ProjectCard from './ProjectCard.svelte';
	import AddProjectDialog from './AddProjectDialog.svelte';
	import IndexingProgress from './IndexingProgress.svelte';
	import { onMount } from 'svelte';

	let showAddDialog = $state(false);
	let indexingProject = $state<string | null>(null);

	onMount(() => {
		projectsStore.load();
	});

	async function handleAddProject(path: string) {
		const project = await projectsStore.add(path);
		if (project) {
			// Start indexing the new project
			indexingProject = project.id;
		}
		showAddDialog = false;
	}

	function handleIndexingComplete() {
		indexingProject = null;
	}
</script>

<div class="projects-view">
	<header class="projects-header">
		<h1>Projects</h1>
		<p class="subtitle">Manage your codebases for AI-assisted development</p>
		<button class="add-btn" onclick={() => (showAddDialog = true)}>
			<span class="icon">+</span>
			Add Project
		</button>
	</header>

	{#if indexingProject}
		<IndexingProgress projectId={indexingProject} onComplete={handleIndexingComplete} />
	{/if}

	{#if projectsStore.loading && !indexingProject}
		<div class="loading">
			<div class="spinner"></div>
			<span>Loading projects...</span>
		</div>
	{:else if projectsStore.error}
		<div class="error">
			<span class="icon">⚠</span>
			{projectsStore.error}
		</div>
	{:else if projectsStore.projects.length === 0}
		<div class="empty-state">
			<div class="empty-icon">📁</div>
			<h2>No Projects Yet</h2>
			<p>Add a project to start indexing your codebase for AI-assisted chat.</p>
			<button class="add-btn primary" onclick={() => (showAddDialog = true)}>
				Add Your First Project
			</button>
		</div>
	{:else}
		<div class="projects-grid">
			{#each projectsStore.projects as project (project.id)}
				<ProjectCard
					{project}
					isSelected={projectsStore.selected?.id === project.id}
					onSelect={() => projectsStore.select(project.id)}
					onRemove={() => projectsStore.remove(project.id)}
					onReindex={() => (indexingProject = project.id)}
				/>
			{/each}
		</div>
	{/if}

	{#if showAddDialog}
		<AddProjectDialog onAdd={handleAddProject} onClose={() => (showAddDialog = false)} />
	{/if}
</div>

<style>
	.projects-view {
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.projects-header {
		margin-bottom: 2rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.projects-header h1 {
		font-size: 1.75rem;
		font-weight: 600;
		margin: 0;
		color: var(--text-primary, #fff);
	}

	.subtitle {
		color: var(--text-secondary, #888);
		margin: 0;
		font-size: 0.9rem;
	}

	.add-btn {
		align-self: flex-start;
		margin-top: 1rem;
		padding: 0.75rem 1.5rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		color: var(--text-primary, #fff);
		font-size: 0.9rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.2s ease;
	}

	.add-btn:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.add-btn.primary {
		background: var(--accent-color, #6366f1);
		border-color: var(--accent-color, #6366f1);
	}

	.add-btn.primary:hover {
		background: var(--accent-hover, #4f46e5);
	}

	.icon {
		font-size: 1.2rem;
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 4rem;
		color: var(--text-secondary, #888);
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-top-color: var(--accent-color, #6366f1);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error {
		padding: 1rem;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 8px;
		color: #ef4444;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px dashed rgba(255, 255, 255, 0.1);
		border-radius: 12px;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.empty-state h2 {
		font-size: 1.25rem;
		margin: 0 0 0.5rem 0;
		color: var(--text-primary, #fff);
	}

	.empty-state p {
		color: var(--text-secondary, #888);
		margin: 0 0 1.5rem 0;
	}

	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1rem;
	}
</style>
