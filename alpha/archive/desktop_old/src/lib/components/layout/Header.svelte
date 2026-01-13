<script lang="ts">
	/**
	 * Header - Page header with title and status
	 */
	import { statusStore, projectsStore } from '$lib/stores';

	interface Props {
		title: string;
	}

	let { title }: Props = $props();
</script>

<header class="header">
	<h1 class="title">{title}</h1>

	<div class="status-bar">
		<div class="status-item">
			<span class="label">Projects:</span>
			<span class="value">{projectsStore.count}</span>
		</div>
		<div class="status-item">
			<span class="status-dot" class:healthy={statusStore.aiReady}></span>
			<span class="label">{statusStore.aiReady ? 'AI Ready' : 'Loading'}</span>
		</div>
	</div>
</header>

<style>
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		background: rgba(255, 255, 255, 0.02);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
		color: white;
	}

	.status-bar {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		font-size: 0.875rem;
	}

	.status-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: rgba(255, 255, 255, 0.6);
	}

	.value {
		color: #60a5fa;
		font-family: monospace;
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #666;
	}

	.status-dot.healthy {
		background: #22c55e;
		box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
	}
</style>
