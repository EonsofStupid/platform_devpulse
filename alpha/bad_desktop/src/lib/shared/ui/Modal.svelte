<script lang="ts">
	/**
	 * Modal - Glass modal dialog with scrim backdrop
	 * Uses global glass recipes from styles/recipes/glass.css
	 */
	import type { Snippet } from 'svelte';

	interface Props {
		open?: boolean;
		title?: string;
		/** Modal intensity - glow adds animated border */
		glow?: boolean;
		/** Scrim intensity */
		scrim?: 'default' | 'intense';
		/** Maximum width */
		maxWidth?: string;
		/** Additional CSS classes */
		class?: string;
		children?: Snippet;
		footer?: Snippet;
		onclose?: () => void;
	}

	let {
		open = $bindable(false),
		title = '',
		glow = false,
		scrim = 'default',
		maxWidth = '500px',
		class: className = '',
		children,
		footer,
		onclose
	}: Props = $props();

	function handleClose() {
		open = false;
		onclose?.();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleClose();
		}
	}

	// Build modal classes
	const modalClasses = $derived(
		['glass-modal', glow ? 'glass-modal-glow' : '', className].filter(Boolean).join(' ')
	);

	// Build scrim classes
	const scrimClasses = $derived(
		scrim === 'intense' ? 'glass-scrim glass-scrim-intense' : 'glass-scrim'
	);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class={scrimClasses}
		onclick={handleBackdropClick}
		role="presentation"
	>
		<div
			class={modalClasses}
			role="dialog"
			aria-modal="true"
			style="max-width: {maxWidth};"
		>
			<div class="modal-header">
				<h2 class="modal-title">{title}</h2>
				<button class="modal-close" onclick={handleClose} aria-label="Close">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"/>
						<line x1="6" y1="6" x2="18" y2="18"/>
					</svg>
				</button>
			</div>

			<div class="modal-content">
				{#if children}
					{@render children()}
				{/if}
			</div>

			{#if footer}
				<div class="modal-footer">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Modal internal layout - uses global glass recipes for appearance */
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--dp-space-4) var(--dp-space-5);
		border-bottom: 1px solid var(--dp-glass-border);
	}

	.modal-title {
		font-size: var(--dp-text-lg);
		font-weight: 600;
		margin: 0;
		color: var(--dp-text-primary);
		text-shadow: 0 1px 2px oklch(0% 0 0 / 0.5);
	}

	.modal-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: var(--dp-radius);
		color: var(--dp-text-muted);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all var(--dp-transition-fast);
	}

	.modal-close:hover {
		color: var(--dp-text-primary);
		background: var(--dp-glass-border);
	}

	.modal-content {
		flex: 1;
		padding: var(--dp-space-5);
		overflow-y: auto;
		color: var(--dp-text-primary);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--dp-space-3);
		padding: var(--dp-space-4) var(--dp-space-5);
		border-top: 1px solid var(--dp-glass-border);
		background: oklch(0% 0 0 / 0.15);
	}
</style>
