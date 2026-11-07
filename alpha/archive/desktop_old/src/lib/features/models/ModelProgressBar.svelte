<script lang="ts">
	/**
	 * ModelProgressBar - Shows model loading progress with stages
	 */

	interface Props {
		stage: 'idle' | 'checking' | 'loading_weights' | 'loading_projector' | 'warming_up' | 'ready' | 'failed';
		progress: number; // 0-100
		error?: string | null;
	}

	let { stage, progress, error = null }: Props = $props();

	const stageLabels: Record<string, string> = {
		idle: 'Idle',
		checking: 'Checking resources...',
		loading_weights: 'Loading weights...',
		loading_projector: 'Loading projector...',
		warming_up: 'Warming up...',
		ready: 'Ready',
		failed: 'Failed'
	};

	const stageColors: Record<string, string> = {
		idle: '#666',
		checking: '#f59e0b',
		loading_weights: '#6366f1',
		loading_projector: '#6366f1',
		warming_up: '#8b5cf6',
		ready: '#22c55e',
		failed: '#ef4444'
	};

	let isActive = $derived(stage !== 'idle' && stage !== 'ready' && stage !== 'failed');
</script>

<div class="progress-container" class:active={isActive} class:ready={stage === 'ready'} class:failed={stage === 'failed'}>
	<div class="progress-header">
		<span class="stage-label">{stageLabels[stage]}</span>
		{#if isActive}
			<span class="progress-pct">{Math.round(progress)}%</span>
		{/if}
	</div>

	<div class="progress-bar-bg">
		<div
			class="progress-bar-fill"
			style="width: {progress}%; background: {stageColors[stage]}"
			class:animated={isActive}
		></div>
	</div>

	{#if error}
		<div class="error-message">{error}</div>
	{/if}
</div>

<style>
	.progress-container {
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.02);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.progress-container.active {
		border-color: rgba(99, 102, 241, 0.3);
	}

	.progress-container.ready {
		border-color: rgba(34, 197, 94, 0.3);
		background: rgba(34, 197, 94, 0.05);
	}

	.progress-container.failed {
		border-color: rgba(239, 68, 68, 0.3);
		background: rgba(239, 68, 68, 0.05);
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.stage-label {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.progress-pct {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6366f1;
	}

	.progress-bar-bg {
		height: 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-bar-fill {
		height: 100%;
		border-radius: 3px;
		transition: width 0.3s ease;
	}

	.progress-bar-fill.animated {
		background-image: linear-gradient(
			-45deg,
			rgba(255, 255, 255, 0.15) 25%,
			transparent 25%,
			transparent 50%,
			rgba(255, 255, 255, 0.15) 50%,
			rgba(255, 255, 255, 0.15) 75%,
			transparent 75%,
			transparent
		);
		background-size: 20px 20px;
		animation: progress-stripes 1s linear infinite;
	}

	@keyframes progress-stripes {
		from {
			background-position: 0 0;
		}
		to {
			background-position: 20px 0;
		}
	}

	.error-message {
		margin-top: 0.5rem;
		font-size: 0.75rem;
		color: #ef4444;
	}
</style>
