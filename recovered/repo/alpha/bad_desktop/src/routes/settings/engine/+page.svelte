<script lang="ts">
	/**
	 * Engine Settings - Core system configuration
	 * File Watcher, Screenshot, Voice, Performance
	 */
</script>

<svelte:head>
	<title>Engine Settings - DevPulse</title>
</svelte:head>

<div class="settings-view">
	<header class="view-header">
		<h1 class="view-title">⚡ Engine</h1>
		<p class="view-subtitle">Core system and performance settings</p>
	</header>

	<div class="settings-grid">
		<section class="card glass">
			<h2 class="card-title">File Watcher</h2>
			<p class="card-desc">Monitor project files for changes</p>
			<div class="toggle-row">
				<span class="toggle-label">Enable File Watcher</span>
				<input type="checkbox" checked class="toggle" />
			</div>
			<div class="setting-row">
				<span class="setting-label">Debounce (ms)</span>
				<input type="number" value="300" min="100" max="2000" class="input-number" />
			</div>
			<div class="setting-row">
				<span class="setting-label">Ignore patterns</span>
				<input type="text" value="node_modules, .git, target" class="input-text" />
			</div>
		</section>

		<section class="card glass">
			<h2 class="card-title">Screenshot</h2>
			<p class="card-desc">Visual capture and analysis</p>
			<div class="toggle-row">
				<span class="toggle-label">Auto-capture on focus</span>
				<input type="checkbox" class="toggle" />
			</div>
			<div class="setting-row">
				<span class="setting-label">Quality</span>
				<select class="input-select">
					<option value="low">Low (faster)</option>
					<option value="medium" selected>Medium</option>
					<option value="high">High (slower)</option>
				</select>
			</div>
		</section>

		<section class="card glass">
			<h2 class="card-title">Voice</h2>
			<p class="card-desc">Speech recognition and synthesis</p>
			<div class="toggle-row">
				<span class="toggle-label">Enable Voice Input</span>
				<input type="checkbox" checked class="toggle" />
			</div>
			<div class="toggle-row">
				<span class="toggle-label">Enable Voice Output</span>
				<input type="checkbox" class="toggle" />
			</div>
			<div class="setting-row">
				<span class="setting-label">Wake word</span>
				<input type="text" value="Hey DevPulse" class="input-text" disabled />
			</div>
		</section>

		<section class="card glass">
			<h2 class="card-title">Performance</h2>
			<p class="card-desc">Resource usage and optimization</p>
			<div class="metric-grid">
				<div class="metric">
					<span class="metric-label">VRAM Usage</span>
					<div class="metric-bar">
						<div class="metric-fill" style="width: 45%"></div>
					</div>
					<span class="metric-value">2.1 / 4.0 GB</span>
				</div>
				<div class="metric">
					<span class="metric-label">Latency</span>
					<div class="metric-bar">
						<div class="metric-fill success" style="width: 20%"></div>
					</div>
					<span class="metric-value">~120ms</span>
				</div>
			</div>
			<div class="toggle-row">
				<span class="toggle-label">Low Power Mode</span>
				<input type="checkbox" class="toggle" />
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

	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--dp-space-2, 0.5rem) 0;
	}

	.toggle-label {
		color: var(--dp-text-primary, white);
		font-size: var(--dp-text-sm, 0.875rem);
	}

	.toggle {
		width: 40px;
		height: 22px;
		accent-color: var(--dp-accent-primary, oklch(75% 0.18 280));
	}

	.setting-row {
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-1, 0.25rem);
	}

	.setting-label {
		font-size: var(--dp-text-xs, 0.75rem);
		color: var(--dp-text-muted, oklch(70% 0 0));
	}

	.input-number,
	.input-text,
	.input-select {
		padding: var(--dp-space-2, 0.5rem) var(--dp-space-3, 0.75rem);
		background: oklch(0% 0 0 / 0.3);
		border: 1px solid oklch(100% 0 0 / 0.1);
		border-radius: var(--dp-radius, 8px);
		color: var(--dp-text-primary, white);
		font-family: var(--dp-font-mono, monospace);
		font-size: var(--dp-text-sm, 0.875rem);
	}

	.input-number:focus,
	.input-text:focus,
	.input-select:focus {
		outline: none;
		border-color: var(--dp-accent-primary, oklch(75% 0.18 280));
		box-shadow: 0 0 0 2px oklch(from var(--dp-accent-primary, oklch(75% 0.18 280)) l c h / 0.2);
	}

	.input-text:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.metric-grid {
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-3, 0.75rem);
	}

	.metric {
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-1, 0.25rem);
	}

	.metric-label {
		font-size: var(--dp-text-xs, 0.75rem);
		color: var(--dp-text-muted, oklch(70% 0 0));
	}

	.metric-bar {
		height: 6px;
		background: oklch(0% 0 0 / 0.3);
		border-radius: var(--dp-radius-full, 9999px);
		overflow: hidden;
	}

	.metric-fill {
		height: 100%;
		background: var(--dp-accent-primary, oklch(75% 0.18 280));
		border-radius: var(--dp-radius-full, 9999px);
		transition: width var(--dp-transition-normal, 200ms);
	}

	.metric-fill.success {
		background: var(--dp-success, oklch(75% 0.18 145));
	}

	.metric-value {
		font-size: var(--dp-text-xs, 0.75rem);
		color: var(--dp-text-secondary, oklch(85% 0 0));
		font-family: var(--dp-font-mono, monospace);
	}
</style>
