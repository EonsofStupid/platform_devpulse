<script lang="ts">
	/**
	 * CodeReviewCard - Code diff review popup for Maestro
	 * AI can present code changes for user to approve/reject
	 */

	interface Props {
		title?: string;
		filename?: string;
		diff: string;
		additions?: number;
		deletions?: number;
		onApprove: () => void;
		onReject: () => void;
		onEdit?: () => void;
	}

	let {
		title = "Review Changes",
		filename,
		diff,
		additions = 0,
		deletions = 0,
		onApprove,
		onReject,
		onEdit,
	}: Props = $props();

	// Parse diff lines for coloring
	function getDiffLines(diffText: string) {
		return diffText.split("\n").map((line) => {
			if (line.startsWith("+") && !line.startsWith("+++")) {
				return { type: "addition", text: line };
			}
			if (line.startsWith("-") && !line.startsWith("---")) {
				return { type: "deletion", text: line };
			}
			if (line.startsWith("@@")) {
				return { type: "header", text: line };
			}
			return { type: "context", text: line };
		});
	}

	let diffLines = $derived(getDiffLines(diff));
</script>

<div class="code-review-card">
	<header class="card-header">
		<h3>{title}</h3>
		{#if filename}
			<span class="filename">{filename}</span>
		{/if}
	</header>

	<div class="stats-bar">
		<span class="stat additions">+{additions}</span>
		<span class="stat deletions">-{deletions}</span>
	</div>

	<div class="diff-container">
		<pre class="diff-content">{#each diffLines as line}<span
					class="diff-line {line.type}">{line.text}</span
				>{"\n"}{/each}</pre>
	</div>

	<footer class="card-footer">
		<button class="btn reject" onclick={onReject}>
			<span class="btn-icon">✕</span>
			Reject
		</button>
		{#if onEdit}
			<button class="btn edit" onclick={onEdit}>
				<span class="btn-icon">✏️</span>
				Edit
			</button>
		{/if}
		<button class="btn approve" onclick={onApprove}>
			<span class="btn-icon">✓</span>
			Approve
		</button>
	</footer>
</div>

<style>
	.code-review-card {
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

	.card-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: #fff;
	}

	.filename {
		font-size: 0.8rem;
		font-family: "JetLlms Mono", "Fira Code", monospace;
		color: rgba(255, 255, 255, 0.5);
		background: rgba(255, 255, 255, 0.05);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
	}

	.stats-bar {
		display: flex;
		gap: 1rem;
		padding: 0.5rem 1rem;
		background: rgba(0, 0, 0, 0.2);
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.stat {
		font-size: 0.8rem;
		font-weight: 600;
		font-family: "JetLlms Mono", "Fira Code", monospace;
	}

	.stat.additions {
		color: #22c55e;
	}

	.stat.deletions {
		color: #ef4444;
	}

	.diff-container {
		max-height: 300px;
		overflow: auto;
		background: rgba(0, 0, 0, 0.3);
	}

	.diff-content {
		margin: 0;
		padding: 0.75rem;
		font-size: 0.8rem;
		font-family: "JetLlms Mono", "Fira Code", monospace;
		line-height: 1.5;
		white-space: pre;
		overflow-x: auto;
	}

	.diff-line {
		display: block;
	}

	.diff-line.addition {
		background: rgba(34, 197, 94, 0.15);
		color: #86efac;
	}

	.diff-line.deletion {
		background: rgba(239, 68, 68, 0.15);
		color: #fca5a5;
	}

	.diff-line.header {
		color: #818cf8;
		font-weight: 600;
	}

	.diff-line.context {
		color: rgba(255, 255, 255, 0.6);
	}

	/* Scrollbar */
	.diff-container::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}

	.diff-container::-webkit-scrollbar-track {
		background: transparent;
	}

	.diff-container::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 3px;
	}

	.card-footer {
		display: flex;
		gap: 0.5rem;
		padding: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.6rem 1rem;
		font-size: 0.85rem;
		font-weight: 500;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-icon {
		font-size: 0.9rem;
	}

	.btn.reject {
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #ef4444;
	}

	.btn.reject:hover {
		background: rgba(239, 68, 68, 0.25);
	}

	.btn.edit {
		background: rgba(245, 158, 11, 0.15);
		border: 1px solid rgba(245, 158, 11, 0.3);
		color: #f59e0b;
	}

	.btn.edit:hover {
		background: rgba(245, 158, 11, 0.25);
	}

	.btn.approve {
		background: rgba(34, 197, 94, 0.15);
		border: 1px solid rgba(34, 197, 94, 0.3);
		color: #22c55e;
	}

	.btn.approve:hover {
		background: rgba(34, 197, 94, 0.25);
	}
</style>
