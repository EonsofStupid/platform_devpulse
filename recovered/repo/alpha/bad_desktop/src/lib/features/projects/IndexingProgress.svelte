<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { listen, type UnlistenFn } from '@tauri-apps/api/event';
	import { invoke } from '@tauri-apps/api/core';

	interface Props {
		projectId: string;
		onComplete: () => void;
	}

	let { projectId, onComplete }: Props = $props();

	type IndexStage = 'scanning' | 'chunking' | 'embedding' | 'uploading' | 'complete' | 'error';

	let stage = $state<IndexStage>('scanning');
	let current = $state(0);
	let total = $state(0);
	let filesScanned = $state(0);
	let chunksProcessed = $state(0);
	let errorMessage = $state<string | null>(null);
	let unlisten: UnlistenFn | null = null;

	const stageLabels: Record<IndexStage, string> = {
		scanning: 'Scanning files...',
		chunking: 'Chunking code...',
		embedding: 'Generating embeddings...',
		uploading: 'Uploading to RRO...',
		complete: 'Indexing complete!',
		error: 'Indexing failed'
	};

	const stageIcons: Record<IndexStage, string> = {
		scanning: '🔍',
		chunking: '✂️',
		embedding: '🧠',
		uploading: '📤',
		complete: '✅',
		error: '❌'
	};

	onMount(async () => {
		// Listen for indexing progress events from Tauri
		unlisten = await listen<{
			stage: IndexStage;
			current: number;
			total: number;
			files_scanned?: number;
			chunks_processed?: number;
			error?: string;
		}>('indexing-progress', (event) => {
			const payload = event.payload;
			stage = payload.stage;
			current = payload.current;
			total = payload.total;

			if (payload.files_scanned !== undefined) {
				filesScanned = payload.files_scanned;
			}
			if (payload.chunks_processed !== undefined) {
				chunksProcessed = payload.chunks_processed;
			}
			if (payload.error) {
				errorMessage = payload.error;
			}

			if (stage === 'complete') {
				setTimeout(onComplete, 2000);
			}
		});

		// Start indexing
		try {
			await invoke('index_project', { projectId });
		} catch (e) {
			stage = 'error';
			errorMessage = e instanceof Error ? e.message : String(e);
		}
	});

	onDestroy(() => {
		if (unlisten) {
			unlisten();
		}
	});

	// Calculate progress percentage
	let progress = $derived(total > 0 ? Math.round((current / total) * 100) : 0);
</script>

<div class="indexing-progress" class:error={stage === 'error'} class:complete={stage === 'complete'}>
	<div class="progress-header">
		<span class="stage-icon">{stageIcons[stage]}</span>
		<span class="stage-label">{stageLabels[stage]}</span>
	</div>

	{#if stage !== 'complete' && stage !== 'error'}
		<div class="progress-bar-container">
			<div class="progress-bar" style="width: {progress}%"></div>
		</div>
		<div class="progress-stats">
			<span>{current} / {total}</span>
			<span>{progress}%</span>
		</div>
	{/if}

	{#if errorMessage}
		<div class="error-message">
			{errorMessage}
		</div>
	{/if}

	{#if stage === 'complete'}
		<div class="completion-stats">
			<div class="stat">
				<span class="stat-value">{filesScanned}</span>
				<span class="stat-label">Files Scanned</span>
			</div>
			<div class="stat">
				<span class="stat-value">{chunksProcessed}</span>
				<span class="stat-label">Chunks Indexed</span>
			</div>
		</div>
	{/if}

	<div class="progress-detail">
		{#if stage === 'scanning'}
			<p>Discovering source files in your project...</p>
		{:else if stage === 'chunking'}
			<p>Breaking code into searchable chunks...</p>
		{:else if stage === 'embedding'}
			<p>Generating vector embeddings with Qwen3-Embedding...</p>
		{:else if stage === 'uploading'}
			<p>Storing vectors in RRO for fast retrieval...</p>
		{:else if stage === 'complete'}
			<p>Your project is ready for AI-assisted search!</p>
		{/if}
	</div>
</div>

<style>
	.indexing-progress {
		background: rgba(99, 102, 241, 0.1);
		border: 1px solid rgba(99, 102, 241, 0.3);
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.indexing-progress.error {
		background: rgba(239, 68, 68, 0.1);
		border-color: rgba(239, 68, 68, 0.3);
	}

	.indexing-progress.complete {
		background: rgba(34, 197, 94, 0.1);
		border-color: rgba(34, 197, 94, 0.3);
	}

	.progress-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.stage-icon {
		font-size: 1.5rem;
	}

	.stage-label {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-primary, #fff);
	}

	.progress-bar-container {
		height: 8px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.progress-bar {
		height: 100%;
		background: var(--accent-color, #6366f1);
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.progress-stats {
		display: flex;
		justify-content: space-between;
		font-size: 0.8rem;
		color: var(--text-secondary, #888);
		margin-bottom: 1rem;
	}

	.error-message {
		background: rgba(239, 68, 68, 0.2);
		padding: 0.75rem;
		border-radius: 6px;
		font-size: 0.85rem;
		color: #ef4444;
		margin-bottom: 1rem;
	}

	.completion-stats {
		display: flex;
		gap: 2rem;
		justify-content: center;
		margin: 1rem 0;
	}

	.stat {
		text-align: center;
	}

	.stat-value {
		display: block;
		font-size: 2rem;
		font-weight: 700;
		color: var(--accent-color, #22c55e);
	}

	.complete .stat-value {
		color: #22c55e;
	}

	.stat-label {
		font-size: 0.8rem;
		color: var(--text-secondary, #888);
	}

	.progress-detail p {
		margin: 0;
		font-size: 0.85rem;
		color: var(--text-secondary, #888);
		text-align: center;
	}
</style>
