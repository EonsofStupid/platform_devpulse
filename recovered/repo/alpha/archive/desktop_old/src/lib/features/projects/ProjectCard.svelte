<script lang="ts">
	import type { Project } from '$lib/api';

	interface Props {
		project: Project;
		isSelected: boolean;
		onSelect: () => void;
		onRemove: () => void;
		onReindex: () => void;
	}

	let { project, isSelected, onSelect, onRemove, onReindex }: Props = $props();

	// Extract folder name from path
	function getFolderName(path: string): string {
		const parts = path.replace(/\\/g, '/').split('/');
		return parts[parts.length - 1] || path;
	}

	// Format timestamp
	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<div class="project-card" class:selected={isSelected}>
	<div class="card-header">
		<div class="project-icon">📁</div>
		<div class="project-info">
			<h3 class="project-name">{project.name || getFolderName(project.path)}</h3>
			<p class="project-path" title={project.path}>{project.path}</p>
		</div>
	</div>

	<div class="card-meta">
		<span class="meta-item">Added {formatDate(project.created_at)}</span>
		{#if isSelected}
			<span class="selected-badge">Active</span>
		{/if}
	</div>

	<div class="card-actions">
		<button class="action-btn" onclick={onSelect} disabled={isSelected}>
			{isSelected ? 'Selected' : 'Select'}
		</button>
		<button class="action-btn secondary" onclick={onReindex} title="Re-index project">
			🔄 Index
		</button>
		<button class="action-btn danger" onclick={onRemove} title="Remove project">
			🗑
		</button>
	</div>
</div>

<style>
	.project-card {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 1.25rem;
		transition: all 0.2s ease;
	}

	.project-card:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.project-card.selected {
		border-color: var(--accent-color, #6366f1);
		background: rgba(99, 102, 241, 0.1);
	}

	.card-header {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.project-icon {
		font-size: 2rem;
		line-height: 1;
	}

	.project-info {
		flex: 1;
		min-width: 0;
	}

	.project-name {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.25rem 0;
		color: var(--text-primary, #fff);
	}

	.project-path {
		font-size: 0.75rem;
		color: var(--text-secondary, #888);
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
		font-size: 0.8rem;
		color: var(--text-secondary, #888);
	}

	.selected-badge {
		background: var(--accent-color, #6366f1);
		color: white;
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: 600;
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-btn {
		flex: 1;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 6px;
		color: var(--text-primary, #fff);
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.15);
	}

	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.action-btn.secondary {
		flex: 0 0 auto;
		padding: 0.5rem 0.75rem;
	}

	.action-btn.danger {
		flex: 0 0 auto;
		padding: 0.5rem 0.75rem;
	}

	.action-btn.danger:hover {
		background: rgba(239, 68, 68, 0.2);
		border-color: rgba(239, 68, 68, 0.3);
	}
</style>
