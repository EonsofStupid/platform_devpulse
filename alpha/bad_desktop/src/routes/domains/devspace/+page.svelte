<script lang="ts">
	/**
	 * DevSpace Page - Development tools and project workspace
	 */
</script>

<svelte:head>
	<title>DevSpace - DevPulse</title>
</svelte:head>

<div class="devspace-view">
	<header class="view-header">
		<h1 class="view-title">DevSpace</h1>
		<p class="view-subtitle">Development tools and project workspace</p>
	</header>

	<div class="content-grid">
		<section class="card glass span-2">
			<h2 class="card-title">Active Projects</h2>
			<div class="projects-list">
				<div class="project-item">
					<span class="project-icon">📁</span>
					<div class="project-info">
						<span class="project-name">No projects indexed</span>
						<span class="project-path">Add a project to get started</span>
					</div>
					<button class="add-project-btn">+ Add Project</button>
				</div>
			</div>
		</section>

		<section class="card glass">
			<h2 class="card-title">Code Intelligence</h2>
			<div class="stat-grid">
				<div class="stat-item">
					<span class="stat-value">0</span>
					<span class="stat-label">Files Indexed</span>
				</div>
				<div class="stat-item">
					<span class="stat-value">0</span>
					<span class="stat-label">Symbols</span>
				</div>
				<div class="stat-item">
					<span class="stat-value">--</span>
					<span class="stat-label">Last Sync</span>
				</div>
			</div>
		</section>

		<section class="card glass">
			<h2 class="card-title">Dev Tools</h2>
			<div class="tool-list">
				<button class="tool-btn">
					<span class="tool-icon">🔍</span>
					<span class="tool-label">Code Search</span>
				</button>
				<button class="tool-btn">
					<span class="tool-icon">📊</span>
					<span class="tool-label">Analytics</span>
				</button>
				<button class="tool-btn">
					<span class="tool-icon">🔧</span>
					<span class="tool-label">Refactor</span>
				</button>
				<button class="tool-btn">
					<span class="tool-icon">📋</span>
					<span class="tool-label">Tasks</span>
				</button>
			</div>
		</section>
	</div>
</div>

<style>
	.devspace-view {
		padding: var(--dp-space-6, 1.5rem);
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-6, 1.5rem);
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

	.content-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--dp-space-4, 1rem);
	}

	.span-2 {
		grid-column: span 2;
	}

	.card {
		padding: var(--dp-space-5, 1.25rem);
		border-radius: var(--dp-radius-lg, 12px);
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-4, 1rem);
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

	.projects-list {
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-3, 0.75rem);
	}

	.project-item {
		display: flex;
		align-items: center;
		gap: var(--dp-space-3, 0.75rem);
		padding: var(--dp-space-3, 0.75rem);
		background: oklch(0% 0 0 / 0.2);
		border-radius: var(--dp-radius, 8px);
	}

	.project-icon {
		font-size: 1.5rem;
	}

	.project-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-1, 0.25rem);
	}

	.project-name {
		font-weight: var(--dp-font-medium, 500);
		color: var(--dp-text-primary, white);
	}

	.project-path {
		font-size: var(--dp-text-xs, 0.75rem);
		color: var(--dp-text-dim, oklch(50% 0 0));
	}

	.add-project-btn {
		padding: var(--dp-space-2, 0.5rem) var(--dp-space-4, 1rem);
		background: var(--dp-accent-primary, oklch(75% 0.18 280));
		border: none;
		border-radius: var(--dp-radius, 8px);
		color: var(--dp-obsidian-950, #050508);
		font-weight: var(--dp-font-semibold, 600);
		font-size: var(--dp-text-sm, 0.875rem);
		cursor: pointer;
		transition: all var(--dp-transition-fast, 150ms);
	}

	.add-project-btn:hover {
		box-shadow: 0 0 20px oklch(from var(--dp-accent-primary, oklch(75% 0.18 280)) l c h / 0.5);
	}

	.stat-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--dp-space-4, 1rem);
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--dp-space-1, 0.25rem);
		padding: var(--dp-space-3, 0.75rem);
		background: oklch(0% 0 0 / 0.2);
		border-radius: var(--dp-radius, 8px);
	}

	.stat-value {
		font-size: var(--dp-text-2xl, 1.5rem);
		font-weight: var(--dp-font-bold, 700);
		color: var(--dp-accent-primary, oklch(75% 0.18 280));
		font-family: var(--dp-font-mono, monospace);
	}

	.stat-label {
		font-size: var(--dp-text-xs, 0.75rem);
		color: var(--dp-text-muted, oklch(70% 0 0));
	}

	.tool-list {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--dp-space-2, 0.5rem);
	}

	.tool-btn {
		display: flex;
		align-items: center;
		gap: var(--dp-space-2, 0.5rem);
		padding: var(--dp-space-3, 0.75rem);
		background: oklch(from var(--dp-accent-primary, oklch(75% 0.18 280)) l c h / 0.1);
		border: 2px solid oklch(from var(--dp-accent-primary, oklch(75% 0.18 280)) l c h / 0.2);
		border-radius: var(--dp-radius, 8px);
		color: var(--dp-text-primary, white);
		font-family: var(--dp-font-sans, system-ui);
		font-size: var(--dp-text-sm, 0.875rem);
		cursor: pointer;
		transition: all var(--dp-transition-fast, 150ms);
	}

	.tool-btn:hover {
		background: oklch(from var(--dp-accent-primary, oklch(75% 0.18 280)) l c h / 0.2);
		border-color: var(--dp-accent-primary, oklch(75% 0.18 280));
		box-shadow: 0 0 16px oklch(from var(--dp-accent-primary, oklch(75% 0.18 280)) l c h / 0.3);
	}

	.tool-icon {
		font-size: 1.25rem;
	}
</style>
