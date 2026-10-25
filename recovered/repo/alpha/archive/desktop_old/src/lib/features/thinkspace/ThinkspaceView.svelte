<script lang="ts">
	/**
	 * ThinkspaceView - AI thinking visualization and rumination
	 * Shows: AI thought processes, reasoning chains, context understanding
	 */
	import { ruminationState } from "$lib/stores/rumination.svelte";

	const isThinking = $derived(ruminationState.isProcessing);
	const layerLabel = $derived(ruminationState.layerLabel);

	// Placeholder thoughts until we wire up real rumination
	interface Thought {
		content: string;
		type: string;
		confidence: number;
	}
	let thoughts = $state<Thought[]>([]);
</script>

<div class="thinkspace">
	<header class="thinkspace-header">
		<h1>Thinkspace</h1>
		<p class="subtitle">Watch Maestro think</p>
	</header>

	<div class="thinking-area glass">
		{#if isThinking}
			<div class="thinking-indicator">
				<div class="llm-animation">🧠</div>
				<span>Maestro is thinking...</span>
			</div>
		{/if}

		<div class="thought-stream">
			{#each thoughts as thought, i}
				<div class="thought-bubble" style="--delay: {i * 0.1}s">
					<div class="thought-content">{thought.content}</div>
					<div class="thought-meta">
						<span class="thought-type">{thought.type}</span>
						<span class="thought-confidence"
							>{Math.round(thought.confidence * 100)}%</span
						>
					</div>
				</div>
			{/each}

			{#if thoughts.length === 0 && !isThinking}
				<div class="empty-state">
					<div class="empty-icon">💭</div>
					<p>
						No thoughts yet. Start a conversation with Maestro to
						see the thinking process.
					</p>
				</div>
			{/if}
		</div>
	</div>

	<div class="context-panel glass">
		<h2>Current Context</h2>
		<div class="context-items">
			<div class="context-item">
				<span class="context-label">Active Project</span>
				<span class="context-value">None</span>
			</div>
			<div class="context-item">
				<span class="context-label">Open Files</span>
				<span class="context-value">0</span>
			</div>
			<div class="context-item">
				<span class="context-label">Memory Used</span>
				<span class="context-value">0 tokens</span>
			</div>
		</div>
	</div>
</div>

<style>
	.thinkspace {
		height: 100%;
		padding: 2rem;
		display: grid;
		grid-template-rows: auto 1fr auto;
		gap: 2rem;
	}

	.thinkspace-header h1 {
		font-size: 2rem;
		font-weight: 600;
		margin: 0;
	}

	.subtitle {
		color: var(--color-text-secondary);
		margin: 0.5rem 0 0;
	}

	.glass {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
	}

	.thinking-area {
		padding: 2rem;
		overflow-y: auto;
	}

	.thinking-indicator {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: rgba(139, 92, 246, 0.1);
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.llm-animation {
		font-size: 2rem;
		animation: think 1s ease-in-out infinite;
	}

	@keyframes think {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.1);
		}
	}

	.thought-stream {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.thought-bubble {
		padding: 1rem 1.25rem;
		background: rgba(255, 255, 255, 0.03);
		border-left: 3px solid #8b5cf6;
		border-radius: 0 0.5rem 0.5rem 0;
		animation: fadeIn 0.3s ease-out;
		animation-delay: var(--delay);
		animation-fill-mode: both;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateX(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.thought-content {
		line-height: 1.6;
		margin-bottom: 0.5rem;
	}

	.thought-meta {
		display: flex;
		gap: 1rem;
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.thought-type {
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.thought-confidence {
		color: #8b5cf6;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: var(--color-text-secondary);
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.context-panel {
		padding: 1.5rem;
	}

	.context-panel h2 {
		font-size: 1rem;
		font-weight: 500;
		margin: 0 0 1rem;
		color: var(--color-text-secondary);
	}

	.context-items {
		display: flex;
		gap: 2rem;
	}

	.context-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.context-label {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.context-value {
		font-size: 1rem;
		font-weight: 500;
	}
</style>
