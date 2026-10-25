<script lang="ts">
	/**
	 * Topbar - Main app header with navigation tabs
	 * Spec: LOGO | [TABS: Main | PulseFeed | Latest] | [Search] | [Status] | [_ □ X]
	 * + Connection status indicators
	 */
	import { page } from '$app/state';
	import { connectionsStore } from '$lib/stores/connections.svelte';
	import { ConnectionIndicator, AnimatedLogo } from '$lib/shared/ui';

	// Key connections to show
	const maestro = $derived(connectionsStore.maestro);
	const engine = $derived(connectionsStore.engine);

	// Navigation tabs
	const tabs = [
		{ id: 'main', label: 'Main', href: '/' },
		{ id: 'pulsefeed', label: 'PulseFeed', href: '/pulsefeed' },
		{ id: 'latest', label: 'Latest', href: '/latest' }
	];

	// Active tab derived from current route
	function isTabActive(href: string): boolean {
		const pathname = page.url.pathname;
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}

	// Search state
	let searchOpen = $state(false);
	let searchQuery = $state('');

	function toggleSearch() {
		searchOpen = !searchOpen;
		if (searchOpen) {
			// Focus input after render
			setTimeout(() => {
				document.getElementById('command-search')?.focus();
			}, 50);
		}
	}

	function handleSearchKey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			searchOpen = false;
			searchQuery = '';
		}
	}

	// Notifications count (placeholder)
	let notificationCount = $state(0);
</script>

<header class="topbar glass-bar glass-tint-teal">
	<!-- Logo - THE ONE animated logo -->
	<div class="topbar-brand">
		<AnimatedLogo size="sm" />
	</div>

	<!-- Navigation Tabs -->
	<nav class="topbar-tabs">
		{#each tabs as tab}
			<a
				href={tab.href}
				class="tab-item glass-button"
				class:active={isTabActive(tab.href)}
			>
				{tab.label}
			</a>
		{/each}
	</nav>

	<!-- Search Command -->
	<div class="topbar-center">
		<button class="search-trigger glass-button" onclick={toggleSearch}>
			<span class="search-icon">🔍</span>
			<span class="search-placeholder">Search commands...</span>
			<kbd class="search-kbd">Ctrl+K</kbd>
		</button>

		{#if searchOpen}
			<div class="search-modal">
				<input
					id="command-search"
					type="text"
					class="search-input glass-input"
					placeholder="Type a command..."
					bind:value={searchQuery}
					onkeydown={handleSearchKey}
				/>
			</div>
		{/if}
	</div>

	<!-- Right Section: Status + Profile + Notifications + Window -->
	<div class="topbar-right">
		<!-- Connection Indicators -->
		<div class="topbar-status">
			<ConnectionIndicator
				state={maestro.state}
				label={maestro.label}
				detail={maestro.detail}
				compact
			/>
			<ConnectionIndicator
				state={engine.state}
				label={engine.label}
				detail={engine.detail}
				compact
			/>
		</div>

		<div class="topbar-divider"></div>

		<!-- Profile -->
		<button class="icon-btn profile" aria-label="Profile">
			<span class="icon">👤</span>
		</button>

		<!-- Notifications -->
		<button class="icon-btn notifications" aria-label="Notifications" class:has-badge={notificationCount > 0}>
			<span class="icon">🔔</span>
			{#if notificationCount > 0}
				<span class="notification-badge">{notificationCount}</span>
			{/if}
		</button>

		<div class="topbar-divider"></div>

		<!-- Window Controls -->
		<div class="topbar-controls">
			<button class="control-btn" aria-label="Minimize">─</button>
			<button class="control-btn" aria-label="Maximize">□</button>
			<button class="control-btn close" aria-label="Close">×</button>
		</div>
	</div>
</header>

<style>
	.topbar {
		height: var(--dp-topbar-height, 52px);
		display: flex;
		align-items: center;
		justify-content: flex-start;
		padding: 0 var(--dp-space-4);
		gap: var(--dp-space-4);

		/* Local tint override for topbar */
		--glass-tint: var(--glass-hue-teal, 195);

		/* Explicit glass styling as fallback */
		background: oklch(8% 0.03 var(--glass-tint) / 0.9);
		backdrop-filter: blur(20px) saturate(180%);
		-webkit-backdrop-filter: blur(20px) saturate(180%);
		border-bottom: 2px solid oklch(50% 0.12 var(--glass-tint) / 0.4);
		box-shadow:
			0 4px 16px oklch(0% 0 0 / 0.4),
			inset 0 1px 1px oklch(75% 0.08 var(--glass-tint) / 0.25);
	}

	/* Brand Section */
	.topbar-brand {
		flex-shrink: 0;
	}

	/* Navigation Tabs */
	.topbar-tabs {
		display: flex;
		align-items: center;
		gap: var(--dp-space-2);
	}

	.tab-item {
		padding: var(--dp-space-2) var(--dp-space-4);
		font-size: var(--dp-text-sm);
		font-weight: var(--dp-font-medium, 500);
		color: var(--dp-text-secondary);
		text-decoration: none;
		border-radius: var(--dp-radius);
		transition: all var(--dp-transition-fast);
	}

	.tab-item:hover {
		color: var(--dp-text-primary);
		background: oklch(from var(--dp-accent-primary) l c h / 0.15);
	}

	.tab-item.active {
		color: var(--dp-text-primary);
		background: linear-gradient(
			135deg,
			oklch(from var(--dp-accent-primary) l c h / 0.25) 0%,
			oklch(from var(--dp-accent-primary) calc(l - 0.1) c h / 0.15) 100%
		);
		border-color: var(--dp-accent-primary);
		box-shadow:
			0 0 12px oklch(from var(--dp-accent-primary) l c h / 0.3),
			inset 0 1px 2px oklch(100% 0 0 / 0.1);
	}

	/* Center - Search */
	.topbar-center {
		flex: 1;
		max-width: 480px;
		position: relative;
	}

	.search-trigger {
		width: 100%;
		display: flex;
		align-items: center;
		gap: var(--dp-space-3);
		padding: var(--dp-space-2) var(--dp-space-4);
		cursor: pointer;
	}

	.search-icon {
		font-size: 0.875rem;
		opacity: 0.7;
	}

	.search-placeholder {
		flex: 1;
		text-align: left;
		color: var(--dp-text-muted);
		font-size: var(--dp-text-sm);
	}

	.search-kbd {
		font-size: 0.625rem;
		font-family: var(--dp-font-mono);
		padding: 2px 6px;
		background: oklch(0% 0 0 / 0.3);
		border: 1px solid var(--dp-glass-border);
		border-radius: var(--dp-radius-sm);
		color: var(--dp-text-muted);
	}

	.search-modal {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: var(--dp-space-2);
		z-index: 100;
	}

	.search-input {
		width: 100%;
		padding: var(--dp-space-3) var(--dp-space-4);
		font-size: var(--dp-text-base);
	}

	/* Right Section */
	.topbar-right {
		display: flex;
		align-items: center;
		gap: var(--dp-space-3);
		flex-shrink: 0;
	}

	.topbar-status {
		display: flex;
		align-items: center;
		gap: var(--dp-space-2);
	}

	.topbar-divider {
		width: 1px;
		height: 24px;
		background: var(--dp-glass-border);
	}

	/* Icon Buttons */
	.icon-btn {
		position: relative;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: oklch(from var(--dp-accent-primary) l c h / 0.1);
		border: 1px solid oklch(from var(--dp-accent-primary) l c h / 0.2);
		border-radius: var(--dp-radius);
		cursor: pointer;
		transition: all var(--dp-transition-fast);
	}

	.icon-btn:hover {
		background: oklch(from var(--dp-accent-primary) l c h / 0.2);
		border-color: oklch(from var(--dp-accent-primary) l c h / 0.4);
		box-shadow: 0 0 12px oklch(from var(--dp-accent-primary) l c h / 0.3);
	}

	.icon-btn .icon {
		font-size: 1rem;
	}

	.notification-badge {
		position: absolute;
		top: -4px;
		right: -4px;
		min-width: 16px;
		height: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.625rem;
		font-weight: var(--dp-font-bold);
		background: var(--dp-error);
		color: white;
		border-radius: var(--dp-radius-full);
		border: 2px solid var(--dp-bg-primary);
	}

	/* Window Controls */
	.topbar-controls {
		display: flex;
		gap: var(--dp-space-1);
	}

	.control-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: oklch(100% 0 0 / 0.05);
		border: 1px solid oklch(100% 0 0 / 0.1);
		border-radius: var(--dp-radius-sm);
		color: var(--dp-text-muted);
		font-size: 1rem;
		cursor: pointer;
		transition: all var(--dp-transition-fast);
	}

	.control-btn:hover {
		background: oklch(100% 0 0 / 0.1);
		color: var(--dp-text-primary);
	}

	.control-btn.close:hover {
		background: oklch(from var(--dp-error) l c h / 0.3);
		border-color: var(--dp-error);
		color: var(--dp-error);
	}
</style>
