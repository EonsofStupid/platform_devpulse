<script lang="ts">
	/**
	 * ConfirmationCard - Yes/No confirmation popup for Maestro
	 * AI can request confirmation before proceeding with actions
	 */

	interface Props {
		title?: string;
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
		variant?: 'default' | 'danger' | 'warning';
		onConfirm: () => void;
		onCancel: () => void;
	}

	let {
		title = 'Confirm Action',
		message,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		variant = 'default',
		onConfirm,
		onCancel
	}: Props = $props();

	const icons: Record<string, string> = {
		default: '❓',
		danger: '⚠️',
		warning: '⚡'
	};
</script>

<div class="confirmation-card" class:danger={variant === 'danger'} class:warning={variant === 'warning'}>
	<div class="card-icon">
		{icons[variant]}
	</div>

	<header class="card-header">
		<h3>{title}</h3>
	</header>

	<p class="message">{message}</p>

	<footer class="card-footer">
		<button class="btn cancel" onclick={onCancel}>
			{cancelLabel}
		</button>
		<button
			class="btn confirm"
			class:danger={variant === 'danger'}
			onclick={onConfirm}
		>
			{confirmLabel}
		</button>
	</footer>
</div>

<style>
	.confirmation-card {
		background: rgba(30, 30, 50, 0.95);
		border: 1px solid rgba(99, 102, 241, 0.3);
		border-radius: 12px;
		padding: 1.25rem;
		max-width: 360px;
		text-align: center;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
	}

	.confirmation-card.danger {
		border-color: rgba(239, 68, 68, 0.4);
	}

	.confirmation-card.warning {
		border-color: rgba(245, 158, 11, 0.4);
	}

	.card-icon {
		font-size: 2.5rem;
		margin-bottom: 0.75rem;
	}

	.card-header h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: #fff;
	}

	.message {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.7);
		margin: 0 0 1.25rem 0;
		line-height: 1.5;
	}

	.card-footer {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
	}

	.btn {
		flex: 1;
		padding: 0.6rem 1rem;
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

	.btn.confirm {
		background: #6366f1;
		border: none;
		color: #fff;
	}

	.btn.confirm:hover {
		background: #4f46e5;
	}

	.btn.confirm.danger {
		background: #ef4444;
	}

	.btn.confirm.danger:hover {
		background: #dc2626;
	}
</style>
