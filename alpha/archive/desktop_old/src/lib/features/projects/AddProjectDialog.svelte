<script lang="ts">
	import { browseFolder } from '$lib/api';

	interface Props {
		onAdd: (path: string) => void;
		onClose: () => void;
	}

	let { onAdd, onClose }: Props = $props();

	let manualPath = $state('');
	let loading = $state(false);

	async function handleBrowse() {
		loading = true;
		try {
			const path = await browseFolder();
			if (path) {
				onAdd(path);
			}
		} finally {
			loading = false;
		}
	}

	function handleManualAdd() {
		if (manualPath.trim()) {
			onAdd(manualPath.trim());
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="dialog-overlay" onclick={onClose} role="presentation">
	<div class="dialog" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
		<header class="dialog-header">
			<h2>Add Project</h2>
			<button class="close-btn" onclick={onClose} aria-label="Close">×</button>
		</header>

		<div class="dialog-content">
			<p class="description">
				Add a project folder to enable AI-assisted search and context-aware chat. The project will
				be indexed for vector search.
			</p>

			<div class="option-section">
				<h3>Browse for folder</h3>
				<button class="browse-btn" onclick={handleBrowse} disabled={loading}>
					{#if loading}
						<span class="spinner"></span>
						Opening...
					{:else}
						📁 Open Folder Picker
					{/if}
				</button>
			</div>

			<div class="divider">
				<span>or</span>
			</div>

			<div class="option-section">
				<h3>Enter path manually</h3>
				<div class="manual-input">
					<input
						type="text"
						bind:value={manualPath}
						placeholder="D:\projects\my-project"
						onkeydown={(e) => e.key === 'Enter' && handleManualAdd()}
					/>
					<button class="add-btn" onclick={handleManualAdd} disabled={!manualPath.trim()}>
						Add
					</button>
				</div>
			</div>
		</div>

		<footer class="dialog-footer">
			<button class="cancel-btn" onclick={onClose}>Cancel</button>
		</footer>
	</div>
</div>

<style>
	.dialog-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
	}

	.dialog {
		background: var(--bg-secondary, #1a1a2e);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 16px;
		width: 90%;
		max-width: 480px;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
	}

	.dialog-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.dialog-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary, #fff);
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: var(--text-secondary, #888);
		cursor: pointer;
		padding: 0;
		line-height: 1;
	}

	.close-btn:hover {
		color: var(--text-primary, #fff);
	}

	.dialog-content {
		padding: 1.5rem;
	}

	.description {
		margin: 0 0 1.5rem 0;
		font-size: 0.9rem;
		color: var(--text-secondary, #888);
		line-height: 1.5;
	}

	.option-section {
		margin-bottom: 1rem;
	}

	.option-section h3 {
		margin: 0 0 0.75rem 0;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-primary, #fff);
	}

	.browse-btn {
		width: 100%;
		padding: 1rem;
		background: rgba(99, 102, 241, 0.2);
		border: 2px dashed rgba(99, 102, 241, 0.4);
		border-radius: 12px;
		color: var(--text-primary, #fff);
		font-size: 1rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		transition: all 0.2s ease;
	}

	.browse-btn:hover:not(:disabled) {
		background: rgba(99, 102, 241, 0.3);
		border-color: rgba(99, 102, 241, 0.6);
	}

	.browse-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.divider {
		display: flex;
		align-items: center;
		margin: 1.5rem 0;
		color: var(--text-secondary, #666);
		font-size: 0.8rem;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: rgba(255, 255, 255, 0.1);
	}

	.divider span {
		padding: 0 1rem;
	}

	.manual-input {
		display: flex;
		gap: 0.5rem;
	}

	.manual-input input {
		flex: 1;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 8px;
		color: var(--text-primary, #fff);
		font-size: 0.9rem;
	}

	.manual-input input::placeholder {
		color: var(--text-secondary, #666);
	}

	.manual-input input:focus {
		outline: none;
		border-color: var(--accent-color, #6366f1);
	}

	.add-btn {
		padding: 0.75rem 1.25rem;
		background: var(--accent-color, #6366f1);
		border: none;
		border-radius: 8px;
		color: white;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.add-btn:hover:not(:disabled) {
		background: var(--accent-hover, #4f46e5);
	}

	.add-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.dialog-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		justify-content: flex-end;
	}

	.cancel-btn {
		padding: 0.6rem 1.25rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 8px;
		color: var(--text-primary, #fff);
		font-size: 0.9rem;
		cursor: pointer;
	}

	.cancel-btn:hover {
		background: rgba(255, 255, 255, 0.15);
	}
</style>
