<script lang="ts">
	/**
	 * FilePreviewCard - File content preview popup for Maestro
	 * AI can show file contents to user
	 */

	interface Props {
		path: string;
		content: string;
		language?: string;
		onClose?: () => void;
		onOpenInEditor?: () => void;
		onCopy?: () => void;
	}

	let {
		path,
		content,
		language = "plaintext",
		onClose,
		onOpenInEditor,
		onCopy,
	}: Props = $props();

	// Extract filename from path
	let filename = $derived(path.split(/[/\\]/).pop() ?? path);

	// Count lines
	let lineCount = $derived(content.split("\n").length);

	let copied = $state(false);

	function handleCopy() {
		navigator.clipboard.writeText(content);
		copied = true;
		onCopy?.();
		setTimeout(() => {
			copied = false;
		}, 2000);
	}
</script>

<div class="file-preview-card">
	<header class="card-header">
		<div class="file-info">
			<span class="file-icon">📄</span>
			<span class="filename">{filename}</span>
			<span class="file-meta">{lineCount} lines • {language}</span>
		</div>
		{#if onClose}
			<button class="close-btn" onclick={onClose} aria-label="Close"
				>×</button
			>
		{/if}
	</header>

	<div class="file-path">{path}</div>

	<div class="content-container">
		<pre class="file-content"><code>{content}</code></pre>
	</div>

	<footer class="card-footer">
		<button class="btn copy" onclick={handleCopy}>
			{copied ? "✓ Copied!" : "Copy"}
		</button>
		{#if onOpenInEditor}
			<button class="btn open" onclick={onOpenInEditor}>
				Open in Editor
			</button>
		{/if}
	</footer>
</div>

<style>
	.file-preview-card {
		background: rgba(30, 30, 50, 0.95);
		border: 1px solid rgba(99, 102, 241, 0.3);
		border-radius: 12px;
		max-width: 600px;
		width: 100%;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		overflow: hidden;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.file-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.file-icon {
		font-size: 1.25rem;
	}

	.filename {
		font-size: 0.95rem;
		font-weight: 600;
		color: #fff;
	}

	.file-meta {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.4);
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

	.file-path {
		padding: 0.5rem 1rem;
		background: rgba(0, 0, 0, 0.2);
		font-size: 0.7rem;
		font-family: "JetLlms Mono", "Fira Code", monospace;
		color: rgba(255, 255, 255, 0.4);
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.content-container {
		max-height: 350px;
		overflow: auto;
		background: rgba(0, 0, 0, 0.3);
	}

	.file-content {
		margin: 0;
		padding: 1rem;
		font-size: 0.8rem;
		font-family: "JetLlms Mono", "Fira Code", monospace;
		line-height: 1.6;
		white-space: pre;
		overflow-x: auto;
		color: rgba(255, 255, 255, 0.85);
	}

	.file-content code {
		font-family: inherit;
	}

	/* Scrollbar */
	.content-container::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}

	.content-container::-webkit-scrollbar-track {
		background: transparent;
	}

	.content-container::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 3px;
	}

	.card-footer {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		justify-content: flex-end;
	}

	.btn {
		padding: 0.5rem 1rem;
		font-size: 0.8rem;
		font-weight: 500;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn.copy {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #fff;
		min-width: 80px;
	}

	.btn.copy:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.btn.open {
		background: #6366f1;
		border: none;
		color: #fff;
	}

	.btn.open:hover {
		background: #4f46e5;
	}
</style>
