<script lang="ts">
	/**
	 * DecisionCard - Multiple choice decision popup for Maestro
	 * AI can present options and get user selection
	 */

	interface Props {
		title?: string;
		description?: string;
		options: string[];
		onSelect: (index: number, option: string) => void;
		onCancel?: () => void;
	}

	let { title = 'Choose an option', description, options, onSelect, onCancel }: Props = $props();

	let selectedIndex = $state<number | null>(null);

	function handleSelect(index: number) {
		selectedIndex = index;
	}

	function handleConfirm() {
		if (selectedIndex !== null) {
			onSelect(selectedIndex, options[selectedIndex]);
		}
	}
</script>

<div class="decision-card">
	<header class="card-header">
		<h3>{title}</h3>
		{#if onCancel}
			<button class="close-btn" onclick={onCancel} aria-label="Close">×</button>
		{/if}
	</header>

	{#if description}
		<p class="description">{description}</p>
	{/if}

	<div class="options-list">
		{#each options as option, i (i)}
			<button
				class="option-btn"
				class:selected={selectedIndex === i}
				onclick={() => handleSelect(i)}
			>
				<span class="option-number">{i + 1}</span>
				<span class="option-text">{option}</span>
				{#if selectedIndex === i}
					<span class="check-icon">✓</span>
				{/if}
			</button>
		{/each}
	</div>

	<footer class="card-footer">
		{#if onCancel}
			<button class="btn cancel" onclick={onCancel}>Cancel</button>
		{/if}
		<button class="btn confirm" onclick={handleConfirm} disabled={selectedIndex === null}>
			Confirm Selection
		</button>
	</footer>
</div>

<style>
	.decision-card {
		background: rgba(30, 30, 50, 0.95);
		border: 1px solid rgba(99, 102, 241, 0.3);
		border-radius: 12px;
		padding: 1rem;
		max-width: 400px;
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

	.options-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.option-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: #fff;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.15s ease;
		text-align: left;
	}

	.option-btn:hover {
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.option-btn.selected {
		background: rgba(99, 102, 241, 0.15);
		border-color: rgba(99, 102, 241, 0.5);
	}

	.option-number {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		flex-shrink: 0;
	}

	.option-btn.selected .option-number {
		background: #6366f1;
	}

	.option-text {
		flex: 1;
	}

	.check-icon {
		color: #22c55e;
		font-size: 1rem;
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

	.btn.confirm:hover:not(:disabled) {
		background: #4f46e5;
	}

	.btn.confirm:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
