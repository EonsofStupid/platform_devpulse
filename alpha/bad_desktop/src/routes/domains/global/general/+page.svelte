<script lang="ts">
	/**
	 * General Page - Quick actions and general tools
	 */
</script>

<svelte:head>
	<title>General - DevPulse</title>
</svelte:head>

<div class="general-view">
	<header class="view-header">
		<h1 class="view-title">General</h1>
		<p class="view-subtitle">Quick actions and general tools</p>
	</header>

	<div class="content-grid">
		<section class="card glass">
			<h2 class="card-title">Quick Actions</h2>
			<div class="action-list">
				<button class="action-btn">
					<span class="action-icon">📸</span>
					<span class="action-label">Screenshot</span>
				</button>
				<button class="action-btn">
					<span class="action-icon">🎙️</span>
					<span class="action-label">Voice Note</span>
				</button>
				<button class="action-btn">
					<span class="action-icon">📝</span>
					<span class="action-label">Quick Note</span>
				</button>
			</div>
		</section>

		<section class="card glass">
			<h2 class="card-title">Recent Activity</h2>
			<p class="placeholder-text">No recent activity</p>
		</section>

		<section class="card glass">
			<h2 class="card-title">Bookmarks</h2>
			<p class="placeholder-text">No bookmarks saved</p>
		</section>
	</div>
</div>

<style>
	.general-view {
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
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: var(--dp-space-4, 1rem);
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

	.action-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--dp-space-3, 0.75rem);
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: var(--dp-space-2, 0.5rem);
		padding: var(--dp-space-3, 0.75rem) var(--dp-space-4, 1rem);
		background: oklch(from var(--dp-accent-primary, oklch(75% 0.18 280)) l c h / 0.1);
		border: 2px solid oklch(from var(--dp-accent-primary, oklch(75% 0.18 280)) l c h / 0.2);
		border-radius: var(--dp-radius, 8px);
		color: var(--dp-text-primary, white);
		font-family: var(--dp-font-sans, system-ui);
		font-size: var(--dp-text-sm, 0.875rem);
		cursor: pointer;
		transition: all var(--dp-transition-fast, 150ms);
	}

	.action-btn:hover {
		background: oklch(from var(--dp-accent-primary, oklch(75% 0.18 280)) l c h / 0.2);
		border-color: var(--dp-accent-primary, oklch(75% 0.18 280));
		box-shadow: 0 0 16px oklch(from var(--dp-accent-primary, oklch(75% 0.18 280)) l c h / 0.3);
	}

	.action-icon {
		font-size: 1.25rem;
	}

	.placeholder-text {
		color: var(--dp-text-dim, oklch(50% 0 0));
		font-size: var(--dp-text-sm, 0.875rem);
		font-style: italic;
		margin: 0;
	}
</style>
