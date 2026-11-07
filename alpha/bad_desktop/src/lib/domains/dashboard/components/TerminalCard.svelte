<script lang="ts">
	/**
	 * TerminalCard - Shows terminal output with error detection
	 * Stack traces, build output, with "Ask Gus" integration
	 */
	import type { TerminalEntry } from '$lib/types/connections';

	interface Props {
		entry?: TerminalEntry | null;
		onAskGus?: (content: string) => void;
		onCopy?: (content: string) => void;
	}

	let {
		entry = null,
		onAskGus,
		onCopy
	}: Props = $props();

	function formatTime(date: Date): string {
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		});
	}

	function handleAskGus() {
		if (entry && onAskGus) {
			onAskGus(entry.content);
		}
	}

	function handleCopy() {
		if (entry) {
			navigator.clipboard.writeText(entry.content);
			onCopy?.(entry.content);
		}
	}
</script>

<div class="terminal-card" class:has-error={entry?.hasError}>
	<div class="card-header">
		<span class="card-title">TERMINAL OUTPUT</span>
		{#if entry?.hasError}
			<span class="error-badge">{entry.errorType || 'ERROR'} DETECTED</span>
		{/if}
	</div>

	{#if entry}
		<div class="terminal-content">
			<pre class="output-text">{entry.content}</pre>
		</div>

		<div class="card-footer">
			<span class="timestamp">{formatTime(entry.timestamp)}</span>

			<div class="actions">
				{#if entry.hasError && onAskGus}
					<button class="action-btn primary" onclick={handleAskGus}>
						<span class="btn-icon">🧠</span>
						Ask Gus About This
					</button>
				{/if}
				<button class="action-btn" onclick={handleCopy}>
					<span class="btn-icon">📋</span>
					Copy
				</button>
			</div>
		</div>
	{:else}
		<div class="empty-state">
			<span class="empty-icon">📟</span>
			<span class="empty-text">No recent terminal output</span>
		</div>
	{/if}
</div>

<style>
	.terminal-card {
		/* Purple/Violet tint for terminal cards */
		--glass-tint: var(--glass-hue-purple, 280);
		--border-tint: var(--glass-hue-violet, 300);

		background: var(--dp-glass-bg);
		backdrop-filter: blur(16px) saturate(180%);
		-webkit-backdrop-filter: blur(16px) saturate(180%);
		border: 2px solid var(--dp-border-accent);
		border-radius: var(--dp-radius-lg, 12px);
		padding: var(--dp-space-4, 1rem);
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-3, 0.75rem);

		/* Bevel effect using local tint */
		box-shadow:
			inset 2px 2px 0 oklch(75% 0.08 var(--glass-tint) / 0.25),
			inset -2px -2px 0 oklch(20% 0.08 var(--glass-tint) / 0.5),
			inset 3px 3px 2px oklch(80% 0.12 var(--glass-tint) / 0.35),
			inset -3px -3px 2px oklch(12% 0.1 var(--glass-tint) / 0.7),
			0 4px 24px var(--dp-glass-shadow);
	}

	.terminal-card.has-error {
		border: 2px solid oklch(from var(--dp-error) l c h / 0.4);
		box-shadow:
			inset 2px 2px 0 var(--dp-bevel-light),
			inset -2px -2px 0 var(--dp-bevel-dark),
			0 0 20px oklch(from var(--dp-error) l c h / 0.2),
			0 4px 24px var(--dp-glass-shadow);
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

	.error-badge {
		font-size: 0.625rem;
		font-weight: var(--dp-font-bold, 700);
		color: var(--dp-error);
		background: oklch(from var(--dp-error) l c h / 0.2);
		padding: 3px 8px;
		border-radius: var(--dp-radius-sm, 4px);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		animation: pulse-error 2s ease-in-out infinite;
	}

	@keyframes pulse-error {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	.terminal-content {
		background: var(--dp-glass-inset-bg-deep);
		border: 1px solid oklch(55% 0.12 var(--glass-tint) / 0.3);
		border-radius: var(--dp-radius, 8px);
		padding: var(--dp-space-3, 0.75rem);
		max-height: 150px;
		overflow-y: auto;
	}

	.output-text {
		margin: 0;
		font-size: var(--dp-text-xs, 0.75rem);
		font-family: var(--dp-font-mono, monospace);
		color: var(--dp-text-secondary);
		white-space: pre-wrap;
		word-break: break-word;
		line-height: 1.5;
	}

	.has-error .output-text {
		color: oklch(from var(--dp-error) calc(l + 0.2) c h);
	}

	.card-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--dp-space-3, 0.75rem);
	}

	.timestamp {
		font-size: var(--dp-text-xs, 0.75rem);
		color: var(--dp-text-dim);
		font-family: var(--dp-font-mono, monospace);
	}

	.actions {
		display: flex;
		gap: var(--dp-space-2, 0.5rem);
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: var(--dp-space-1, 0.25rem);
		padding: var(--dp-space-1, 0.25rem) var(--dp-space-3, 0.75rem);
		background: var(--dp-glass-inset-bg);
		border: 1px solid oklch(55% 0.12 var(--glass-tint) / 0.4);
		border-radius: var(--dp-radius, 8px);
		color: var(--dp-text-secondary);
		font-size: var(--dp-text-xs, 0.75rem);
		font-weight: var(--dp-font-medium, 500);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.action-btn:hover {
		background: oklch(from var(--dp-accent-primary) l c h / 0.15);
		border-color: var(--dp-accent-primary);
		color: var(--dp-text-primary);
	}

	.action-btn.primary {
		background: oklch(from var(--dp-accent-primary) l c h / 0.2);
		border-color: var(--dp-accent-primary);
		color: var(--dp-accent-primary);
	}

	.action-btn.primary:hover {
		background: oklch(from var(--dp-accent-primary) l c h / 0.3);
		box-shadow: 0 0 12px oklch(from var(--dp-accent-primary) l c h / 0.3);
	}

	.btn-icon {
		font-size: 0.875rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--dp-space-2, 0.5rem);
		padding: var(--dp-space-6, 1.5rem);
		color: var(--dp-text-dim);
	}

	.empty-icon {
		font-size: 2rem;
		opacity: 0.5;
	}

	.empty-text {
		font-size: var(--dp-text-sm, 0.875rem);
		font-style: italic;
	}

	/* Scrollbar */
	.terminal-content::-webkit-scrollbar {
		width: 4px;
	}

	.terminal-content::-webkit-scrollbar-track {
		background: transparent;
	}

	.terminal-content::-webkit-scrollbar-thumb {
		background: var(--dp-glass-border);
		border-radius: var(--dp-radius-full);
	}
</style>
