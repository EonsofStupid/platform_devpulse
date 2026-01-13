<script lang="ts">
	/**
	 * Chat Settings - Chat window configuration
	 */
</script>

<svelte:head>
	<title>Chat Settings - DevPulse</title>
</svelte:head>

<div class="settings-view">
	<header class="view-header">
		<h1 class="view-title">💬 Chat</h1>
		<p class="view-subtitle">Chat window and conversation settings</p>
	</header>

	<div class="settings-grid">
		<section class="card glass">
			<h2 class="card-title">Window Behavior</h2>
			<div class="toggle-row">
				<span class="toggle-label">Always on top</span>
				<input type="checkbox" class="toggle" />
			</div>
			<div class="toggle-row">
				<span class="toggle-label">Transparent when inactive</span>
				<input type="checkbox" checked class="toggle" />
			</div>
			<div class="toggle-row">
				<span class="toggle-label">Show in taskbar</span>
				<input type="checkbox" checked class="toggle" />
			</div>
			<div class="setting-row">
				<span class="setting-label">Opacity when inactive</span>
				<input type="range" min="20" max="100" value="70" class="slider" />
			</div>
		</section>

		<section class="card glass">
			<h2 class="card-title">Keyboard Shortcuts</h2>
			<div class="shortcut-list">
				<div class="shortcut-item">
					<span class="shortcut-action">Open Chat</span>
					<kbd class="shortcut-key">Ctrl + G</kbd>
				</div>
				<div class="shortcut-item">
					<span class="shortcut-action">Voice Input</span>
					<kbd class="shortcut-key">Ctrl + Shift + V</kbd>
				</div>
				<div class="shortcut-item">
					<span class="shortcut-action">Send Message</span>
					<kbd class="shortcut-key">Enter</kbd>
				</div>
				<div class="shortcut-item">
					<span class="shortcut-action">New Line</span>
					<kbd class="shortcut-key">Shift + Enter</kbd>
				</div>
			</div>
		</section>

		<section class="card glass">
			<h2 class="card-title">Appearance</h2>
			<div class="setting-row">
				<span class="setting-label">Message font size</span>
				<select class="input-select">
					<option value="small">Small</option>
					<option value="medium" selected>Medium</option>
					<option value="large">Large</option>
				</select>
			</div>
			<div class="toggle-row">
				<span class="toggle-label">Show timestamps</span>
				<input type="checkbox" checked class="toggle" />
			</div>
			<div class="toggle-row">
				<span class="toggle-label">Compact mode</span>
				<input type="checkbox" class="toggle" />
			</div>
		</section>

		<section class="card glass">
			<h2 class="card-title">History</h2>
			<div class="setting-row">
				<span class="setting-label">Keep history for</span>
				<select class="input-select">
					<option value="7">7 days</option>
					<option value="30" selected>30 days</option>
					<option value="90">90 days</option>
					<option value="forever">Forever</option>
				</select>
			</div>
			<div class="toggle-row">
				<span class="toggle-label">Auto-save conversations</span>
				<input type="checkbox" checked class="toggle" />
			</div>
			<button class="danger-btn">Clear All History</button>
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

	.input-select {
		padding: var(--dp-space-2, 0.5rem) var(--dp-space-3, 0.75rem);
		background: oklch(0% 0 0 / 0.3);
		border: 1px solid oklch(100% 0 0 / 0.1);
		border-radius: var(--dp-radius, 8px);
		color: var(--dp-text-primary, white);
		font-size: var(--dp-text-sm, 0.875rem);
	}

	.input-select:focus {
		outline: none;
		border-color: var(--dp-accent-primary, oklch(75% 0.18 280));
	}

	.slider {
		width: 100%;
		accent-color: var(--dp-accent-primary, oklch(75% 0.18 280));
	}

	.shortcut-list {
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-2, 0.5rem);
	}

	.shortcut-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--dp-space-2, 0.5rem) var(--dp-space-3, 0.75rem);
		background: oklch(0% 0 0 / 0.2);
		border-radius: var(--dp-radius, 8px);
	}

	.shortcut-action {
		font-size: var(--dp-text-sm, 0.875rem);
		color: var(--dp-text-primary, white);
	}

	.shortcut-key {
		padding: var(--dp-space-1, 0.25rem) var(--dp-space-2, 0.5rem);
		background: oklch(0% 0 0 / 0.4);
		border: 1px solid oklch(100% 0 0 / 0.15);
		border-radius: var(--dp-radius-sm, 4px);
		font-family: var(--dp-font-mono, monospace);
		font-size: var(--dp-text-xs, 0.75rem);
		color: var(--dp-text-secondary, oklch(85% 0 0));
	}

	.danger-btn {
		margin-top: var(--dp-space-2, 0.5rem);
		padding: var(--dp-space-2, 0.5rem) var(--dp-space-4, 1rem);
		background: oklch(from var(--dp-error, oklch(65% 0.25 25)) l c h / 0.15);
		border: 1px solid oklch(from var(--dp-error, oklch(65% 0.25 25)) l c h / 0.3);
		border-radius: var(--dp-radius, 8px);
		color: var(--dp-error, oklch(65% 0.25 25));
		font-size: var(--dp-text-sm, 0.875rem);
		cursor: pointer;
		transition: all var(--dp-transition-fast, 150ms);
	}

	.danger-btn:hover {
		background: oklch(from var(--dp-error, oklch(65% 0.25 25)) l c h / 0.25);
	}
</style>
