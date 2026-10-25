<script lang="ts">
	/**
	 * ContextCard - Shows active context (IDE, file, line, repo)
	 * With tracking button and mood indicator
	 */
	interface Props {
		contextName: string;
		currentFile?: string;
		line?: number;
		repository?: string;
		mood?: 'fire' | 'calm' | 'focus' | 'stress';
		tracking?: boolean;
	}

	let {
		contextName,
		currentFile,
		line,
		repository,
		mood = 'calm',
		tracking = false
	}: Props = $props();

	const moodEmoji = {
		fire: '🔥',
		calm: '😌',
		focus: '🎯',
		stress: '😰'
	};
</script>

<div class="context-card">
	<div class="card-header">
		<span class="card-title">ACTIVE CONTEXT</span>
		<button class="tracking-btn" class:active={tracking}>
			{tracking ? 'TRACKING' : 'PAUSED'}
		</button>
	</div>

	<div class="context-name">{contextName}</div>

	<div class="context-details">
		<div class="detail-group">
			{#if currentFile}
				<div class="detail-row">
					<span class="detail-label">CURRENT FILE</span>
					<span class="detail-value">{currentFile}</span>
				</div>
			{/if}

			{#if line}
				<div class="detail-row">
					<span class="detail-label">LINE</span>
					<span class="detail-value">{line}</span>
				</div>
			{/if}

			{#if repository}
				<div class="detail-row">
					<span class="detail-label">REPOSITORY</span>
					<span class="detail-value">{repository}</span>
				</div>
			{/if}
		</div>

		<div class="mood-indicator">
			<span class="mood-emoji">{moodEmoji[mood]}</span>
			<span class="mood-label">Current Mood</span>
		</div>
	</div>
</div>

<style>
	.context-card {
		/* Blue/Indigo tint for context cards */
		--glass-tint: var(--glass-hue-blue, 220);
		--border-tint: var(--glass-hue-indigo, 250);

		background: var(--dp-glass-bg);
		backdrop-filter: blur(16px) saturate(180%);
		-webkit-backdrop-filter: blur(16px) saturate(180%);
		border: 2px solid var(--dp-border-accent);
		border-radius: var(--dp-radius-lg, 12px);
		padding: var(--dp-space-4, 1rem);
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-3, 0.75rem);
		box-shadow:
			0 4px 24px var(--dp-glass-shadow),
			inset 2px 2px 0 oklch(75% 0.08 var(--glass-tint) / 0.25),
			inset -2px -2px 0 oklch(20% 0.08 var(--glass-tint) / 0.5);
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.card-title {
		font-size: var(--dp-text-xs, 0.75rem);
		font-weight: var(--dp-font-semibold, 600);
		color: var(--dp-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.tracking-btn {
		padding: var(--dp-space-1, 0.25rem) var(--dp-space-3, 0.75rem);
		background: var(--dp-glass-inset-bg);
		border: 1px solid oklch(55% 0.12 var(--glass-tint) / 0.4);
		border-radius: var(--dp-radius, 8px);
		color: var(--dp-text-secondary);
		font-size: var(--dp-text-xs, 0.75rem);
		font-weight: var(--dp-font-semibold, 600);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.tracking-btn.active {
		background: oklch(from var(--dp-accent-primary) l c h / 0.2);
		border-color: var(--dp-accent-primary);
		color: var(--dp-accent-primary);
	}

	.context-name {
		font-size: var(--dp-text-xl, 1.25rem);
		font-weight: var(--dp-font-bold, 700);
		color: var(--dp-text-primary);
	}

	.context-details {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: var(--dp-space-4, 1rem);
	}

	.detail-group {
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-2, 0.5rem);
	}

	.detail-row {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.detail-label {
		font-size: var(--dp-text-xs, 0.75rem);
		color: var(--dp-text-dim);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.detail-value {
		font-size: var(--dp-text-sm, 0.875rem);
		color: var(--dp-text-secondary);
		font-family: var(--dp-font-mono, monospace);
	}

	.mood-indicator {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--dp-space-1, 0.25rem);
	}

	.mood-emoji {
		font-size: 2.5rem;
		filter: drop-shadow(0 0 8px oklch(70% 0.3 30 / 0.5));
	}

	.mood-label {
		font-size: var(--dp-text-xs, 0.75rem);
		color: var(--dp-text-muted);
	}
</style>
