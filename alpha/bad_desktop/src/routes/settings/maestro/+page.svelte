<script lang="ts">
	/**
	 * Maestro Settings - Orchestrator config (Layman Facade)
	 * User sees: Llm, Memory, Assistants, Thinking Style, Quality Check
	 */
</script>

<svelte:head>
	<title>Maestro Settings - DevPulse</title>
</svelte:head>

<div class="settings-view">
	<header class="view-header">
		<h1 class="view-title">🧠 Maestro</h1>
		<p class="view-subtitle">
			Configure your AI assistant's personality and capabilities
		</p>
	</header>

	<div class="settings-grid">
		<section class="card glass">
			<h2 class="card-title">Llm</h2>
			<p class="card-desc">
				Choose how your assistant thinks and responds
			</p>
			<div class="option-group">
				<label class="option-item">
					<input type="radio" name="llm" value="balanced" checked />
					<span class="option-content">
						<span class="option-label">Balanced</span>
						<span class="option-hint">Good for everyday tasks</span>
					</span>
				</label>
				<label class="option-item">
					<input type="radio" name="llm" value="creative" />
					<span class="option-content">
						<span class="option-label">Creative</span>
						<span class="option-hint"
							>More imaginative responses</span
						>
					</span>
				</label>
				<label class="option-item">
					<input type="radio" name="llm" value="precise" />
					<span class="option-content">
						<span class="option-label">Precise</span>
						<span class="option-hint">Technical and detailed</span>
					</span>
				</label>
			</div>
		</section>

		<section class="card glass">
			<h2 class="card-title">Memory</h2>
			<p class="card-desc">How much context your assistant remembers</p>
			<div class="slider-group">
				<input type="range" min="1" max="5" value="3" class="slider" />
				<div class="slider-labels">
					<span>Minimal</span>
					<span>Maximum</span>
				</div>
			</div>
			<div class="memory-stats">
				<span class="stat">Indexed: 0 items</span>
				<span class="stat">Storage: 0 MB</span>
			</div>
		</section>

		<section class="card glass">
			<h2 class="card-title">Assistants</h2>
			<p class="card-desc">Specialized helpers for different tasks</p>
			<div class="toggle-list">
				<label class="toggle-item">
					<input type="checkbox" checked />
					<span class="toggle-label">Guardian</span>
					<span class="toggle-hint">Safety and quality checks</span>
				</label>
				<label class="toggle-item">
					<input type="checkbox" checked />
					<span class="toggle-label">Researcher</span>
					<span class="toggle-hint">Deep information lookup</span>
				</label>
				<label class="toggle-item">
					<input type="checkbox" />
					<span class="toggle-label">Coder</span>
					<span class="toggle-hint">Code generation and review</span>
				</label>
			</div>
		</section>

		<section class="card glass">
			<h2 class="card-title">Quality Check</h2>
			<p class="card-desc">How strict the assistant should be</p>
			<div class="option-group horizontal">
				<label class="option-item">
					<input type="radio" name="quality" value="relaxed" />
					<span class="option-content">
						<span class="option-label">Relaxed</span>
					</span>
				</label>
				<label class="option-item">
					<input
						type="radio"
						name="quality"
						value="standard"
						checked
					/>
					<span class="option-content">
						<span class="option-label">Standard</span>
					</span>
				</label>
				<label class="option-item">
					<input type="radio" name="quality" value="strict" />
					<span class="option-content">
						<span class="option-label">Strict</span>
					</span>
				</label>
			</div>
		</section>
	</div>
</div>

<style>
	.settings-view {
		padding: var(--dp-space-6, 1.5rem);
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-6, 1.5rem);
		max-width: 900px;
	}

	.view-header {
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-2, 0.5rem);
	}

	.view-title {
		font-size: var(--dp-text-2xl, 1.5rem);
		font-weight: var(--dp-font-bold, 700);
		color: var(--dp-text-primary, white);
		margin: 0;
	}

	.view-subtitle {
		font-size: var(--dp-text-sm, 0.875rem);
		color: var(--dp-text-muted, oklch(70% 0 0));
		margin: 0;
	}

	.settings-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--dp-space-4, 1rem);
	}

	.card {
		padding: var(--dp-space-5, 1.25rem);
		border-radius: var(--dp-radius-lg, 12px);
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-3, 0.75rem);
	}

	.glass {
		background: var(--dp-glass-bg, oklch(100% 0 0 / 0.03));
		backdrop-filter: blur(16px) saturate(180%);
		-webkit-backdrop-filter: blur(16px) saturate(180%);
		border: 2px solid var(--dp-glass-border-bright, oklch(100% 0 0 / 0.15));
		box-shadow:
			0 4px 24px oklch(0% 0 0 / 0.3),
			inset 0 1px 1px oklch(100% 0 0 / 0.1);
	}

	.card-title {
		font-size: var(--dp-text-lg, 1.125rem);
		font-weight: var(--dp-font-semibold, 600);
		color: var(--dp-text-primary, white);
		margin: 0;
	}

	.card-desc {
		font-size: var(--dp-text-sm, 0.875rem);
		color: var(--dp-text-muted, oklch(70% 0 0));
		margin: 0;
	}

	.option-group {
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-2, 0.5rem);
	}

	.option-group.horizontal {
		flex-direction: row;
	}

	.option-item {
		display: flex;
		align-items: flex-start;
		gap: var(--dp-space-3, 0.75rem);
		padding: var(--dp-space-3, 0.75rem);
		background: oklch(0% 0 0 / 0.2);
		border-radius: var(--dp-radius, 8px);
		cursor: pointer;
		transition: all var(--dp-transition-fast, 150ms);
	}

	.option-item:hover {
		background: oklch(0% 0 0 / 0.3);
	}

	.option-item:has(input:checked) {
		background: oklch(
			from var(--dp-accent-primary, oklch(75% 0.18 280)) l c h / 0.15
		);
		border: 1px solid
			oklch(
				from var(--dp-accent-primary, oklch(75% 0.18 280)) l c h / 0.3
			);
	}

	.option-content {
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-1, 0.25rem);
	}

	.option-label {
		font-weight: var(--dp-font-medium, 500);
		color: var(--dp-text-primary, white);
	}

	.option-hint {
		font-size: var(--dp-text-xs, 0.75rem);
		color: var(--dp-text-dim, oklch(50% 0 0));
	}

	.slider-group {
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-2, 0.5rem);
	}

	.slider {
		width: 100%;
		accent-color: var(--dp-accent-primary, oklch(75% 0.18 280));
	}

	.slider-labels {
		display: flex;
		justify-content: space-between;
		font-size: var(--dp-text-xs, 0.75rem);
		color: var(--dp-text-dim, oklch(50% 0 0));
	}

	.memory-stats {
		display: flex;
		gap: var(--dp-space-4, 1rem);
		padding-top: var(--dp-space-2, 0.5rem);
		border-top: 1px solid oklch(100% 0 0 / 0.1);
	}

	.stat {
		font-size: var(--dp-text-xs, 0.75rem);
		color: var(--dp-text-muted, oklch(70% 0 0));
		font-family: var(--dp-font-mono, monospace);
	}

	.toggle-list {
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-2, 0.5rem);
	}

	.toggle-item {
		display: flex;
		align-items: center;
		gap: var(--dp-space-3, 0.75rem);
		padding: var(--dp-space-2, 0.5rem) var(--dp-space-3, 0.75rem);
		background: oklch(0% 0 0 / 0.2);
		border-radius: var(--dp-radius, 8px);
		cursor: pointer;
	}

	.toggle-label {
		font-weight: var(--dp-font-medium, 500);
		color: var(--dp-text-primary, white);
	}

	.toggle-hint {
		margin-left: auto;
		font-size: var(--dp-text-xs, 0.75rem);
		color: var(--dp-text-dim, oklch(50% 0 0));
	}
</style>
