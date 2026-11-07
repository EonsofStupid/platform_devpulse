<script lang="ts">
	/**
	 * EditingCard - Text editing popup for Maestro
	 * AI can present content for user to edit before applying
	 */

	interface Props {
		title?: string;
		description?: string;
		content: string;
		placeholder?: string;
		onSave: (text: string) => void;
		onCancel?: () => void;
	}

	let {
		title = "Edit Content",
		description,
		content,
		placeholder = "Enter text...",
		onSave,
		onCancel,
	}: Props = $props();

	let editedContent = $state(content);

	function handleSave() {
		onSave(editedContent);
	}

	function handleReset() {
		editedContent = content;
	}

	let hasChanges = $derived(editedContent !== content);
</script>

<div class="editing-card">
	<header class="card-header">
		<h3>{title}</h3>
		{#if onCancel}
			<button class="close-btn" onclick={onCancel} aria-label="Close"
				>×</button
			>
		{/if}
	</header>

	{#if description}
		<p class="description">{description}</p>
	{/if}

	<div class="editor-area">
		<textarea bind:value={editedContent} {placeholder} rows="8"></textarea>
	</div>

	<div class="editor-stats">
		<span class="char-count">{editedContent.length} characters</span>
		{#if hasChanges}
			<span class="modified-badge">Modified</span>
		{/if}
	</div>

	<footer class="card-footer">
		{#if hasChanges}
			<button class="btn reset" onclick={handleReset}>Reset</button>
		{/if}
		{#if onCancel}
			<button class="btn cancel" onclick={onCancel}>Cancel</button>
		{/if}
		<button class="btn save" onclick={handleSave}> Save Changes </button>
	</footer>
</div>

<style>
	.editing-card {
		background: rgba(30, 30, 50, 0.95);
		border: 1px solid rgba(99, 102, 241, 0.3);
		border-radius: 12px;
		padding: 1rem;
		max-width: 500px;
		width: 100%;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.card-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: #fff;
	}

	.close-btn {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.5);
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0;
		line-height: 1;
	}

	.close-btn:hover {
		color: #fff;
	}

	.description {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.6);
		margin: 0 0 1rem 0;
		line-height: 1.4;
	}

	.editor-area {
		margin-bottom: 0.5rem;
	}

	.editor-area textarea {
		width: 100%;
		padding: 0.75rem;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: #fff;
		font-size: 0.9rem;
		font-family: "JetLlms Mono", "Fira Code", monospace;
		line-height: 1.5;
		resize: vertical;
		min-height: 120px;
	}

	.editor-area textarea::placeholder {
		color: rgba(255, 255, 255, 0.3);
	}

	.editor-area textarea:focus {
		outline: none;
		border-color: rgba(99, 102, 241, 0.5);
	}

	.editor-stats {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		font-size: 0.75rem;
	}

	.char-count {
		color: rgba(255, 255, 255, 0.4);
	}

	.modified-badge {
		background: rgba(245, 158, 11, 0.2);
		color: #f59e0b;
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		font-weight: 500;
	}

	.card-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		font-size: 0.85rem;
		font-weight: 500;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn.reset {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: rgba(255, 255, 255, 0.7);
	}

	.btn.reset:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.btn.cancel {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #fff;
	}

	.btn.cancel:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.btn.save {
		background: #22c55e;
		border: none;
		color: #fff;
	}

	.btn.save:hover {
		background: #16a34a;
	}
</style>
