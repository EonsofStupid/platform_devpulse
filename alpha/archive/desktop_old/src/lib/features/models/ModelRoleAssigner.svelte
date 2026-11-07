<script lang="ts">
	/**
	 * ModelRoleAssigner - Dropdown to select which model to assign to a role
	 * Lists available local models for selection
	 */

	interface ModelOption {
		id: string;
		name: string;
		size_gb: number;
		format: string;
	}

	interface Props {
		role: string;
		currentModelId: string | null;
		availableModels: ModelOption[];
		onAssign: (modelId: string) => void;
		onClose: () => void;
	}

	let { role, currentModelId, availableModels, onAssign, onClose }: Props = $props();

	let selectedId = $state(currentModelId ?? '');

	function handleAssign() {
		if (selectedId) {
			onAssign(selectedId);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="assigner-overlay" onclick={onClose} role="presentation">
	<div class="assigner-dialog" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
		<header class="dialog-header">
			<h3>Assign Model to {role.toUpperCase()}</h3>
			<button class="close-btn" onclick={onClose} aria-label="Close">×</button>
		</header>

		<div class="dialog-body">
			{#if availableModels.length === 0}
				<div class="empty-state">
					<p>No models available locally.</p>
					<p class="hint">Download models from HuggingFace to get started.</p>
				</div>
			{:else}
				<div class="model-list">
					{#each availableModels as model (model.id)}
						<label class="model-option" class:selected={selectedId === model.id}>
							<input
								type="radio"
								name="model-selection"
								value={model.id}
								bind:group={selectedId}
							/>
							<div class="model-info">
								<span class="model-name">{model.name}</span>
								<span class="model-meta">
									{model.size_gb.toFixed(1)} GB • {model.format}
								</span>
							</div>
							{#if model.id === currentModelId}
								<span class="current-badge">Current</span>
							{/if}
						</label>
					{/each}
				</div>
			{/if}
		</div>

		<footer class="dialog-footer">
			<button class="btn cancel" onclick={onClose}>Cancel</button>
			<button
				class="btn assign"
				onclick={handleAssign}
				disabled={!selectedId || selectedId === currentModelId}
			>
				Assign Model
			</button>
		</footer>
	</div>
</div>

<style>
	.assigner-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
	}

	.assigner-dialog {
		background: var(--bg-secondary, #1a1a2e);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 16px;
		width: 90%;
		max-width: 480px;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
	}

	.dialog-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.dialog-header h3 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: #fff;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		padding: 0;
		line-height: 1;
	}

	.close-btn:hover {
		color: #fff;
	}

	.dialog-body {
		padding: 1rem 1.25rem;
		overflow-y: auto;
		flex: 1;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.empty-state p {
		margin: 0 0 0.5rem 0;
	}

	.hint {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.4);
	}

	.model-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.model-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.model-option:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.model-option.selected {
		background: rgba(99, 102, 241, 0.1);
		border-color: rgba(99, 102, 241, 0.4);
	}

	.model-option input[type='radio'] {
		appearance: none;
		width: 18px;
		height: 18px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		cursor: pointer;
		position: relative;
	}

	.model-option input[type='radio']:checked {
		border-color: #6366f1;
	}

	.model-option input[type='radio']:checked::after {
		content: '';
		position: absolute;
		top: 3px;
		left: 3px;
		width: 8px;
		height: 8px;
		background: #6366f1;
		border-radius: 50%;
	}

	.model-info {
		flex: 1;
	}

	.model-name {
		display: block;
		font-size: 0.9rem;
		font-weight: 500;
		color: #fff;
	}

	.model-meta {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.current-badge {
		font-size: 0.65rem;
		font-weight: 600;
		padding: 0.2rem 0.5rem;
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
		border-radius: 4px;
	}

	.dialog-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.btn {
		padding: 0.6rem 1.25rem;
		font-size: 0.9rem;
		font-weight: 500;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn.cancel {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #fff;
	}

	.btn.cancel:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.btn.assign {
		background: #6366f1;
		border: none;
		color: #fff;
	}

	.btn.assign:hover:not(:disabled) {
		background: #4f46e5;
	}

	.btn.assign:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
