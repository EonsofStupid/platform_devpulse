<script lang="ts">
	/**
	 * Sidebar - Deep Glass Navigation
	 * Dashboard | Projects | ThinkSpace | PulseFeed | DevSpace | Settings
	 * Uses shellStore for collapse/resize state
	 * Settings closes when navigating to non-settings routes
	 */
	import { page } from '$app/state';
	import { shellStore } from '../stores/shell.svelte';

	let settingsExpanded = $state(false);
	let isResizing = $state(false);

	// Use store for collapsed state
	let collapsed = $derived(shellStore.collapsed);

	const navGroups = [
		{ href: '/', label: 'Dashboard', icon: '🏠' },
		{ href: '/domains/workspace/projects', label: 'Projects', icon: '📁' },
		{ href: '/domains/workspace/cortex', label: 'Cortex', icon: '🧠' },
		{ href: '/domains/workspace/thinkspace', label: 'ThinkSpace', icon: '💭' },
		{ href: '/domains/global/pulse', label: 'PulseFeed', icon: '📡' },
		{ href: '/domains/devspace', label: 'DevSpace', icon: '⚡' },
	];

	const settingsItems = [
		{ href: '/settings/maestro', label: 'Maestro', icon: '🧠' },
		{ href: '/settings/models', label: 'Models', icon: '📦' },
		{ href: '/settings/engine', label: 'Engine', icon: '⚙️' },
		{ href: '/settings/chat', label: 'Chat', icon: '💬' },
	];

	// Auto-close settings when navigating away
	$effect(() => {
		const pathname = page.url.pathname;
		if (!pathname.startsWith('/settings') && settingsExpanded) {
			settingsExpanded = false;
		}
	});

	function isActive(href: string): boolean {
		const pathname = page.url.pathname;
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}

	function toggleSettings() {
		settingsExpanded = !settingsExpanded;
	}

	function toggleCollapse() {
		shellStore.toggleCollapse();
		if (shellStore.collapsed) settingsExpanded = false;
	}

	// Close settings when clicking main nav (for instant feedback)
	function handleNavClick() {
		settingsExpanded = false;
	}

	// Resize handle logic (uses px for mouse delta calculations)
	function startResize(e: MouseEvent) {
		isResizing = true;
		const startX = e.clientX;
		const startWidth = shellStore.sidebarWidthPx;

		function onMouseMove(e: MouseEvent) {
			const delta = e.clientX - startX;
			shellStore.setSidebarWidth(startWidth + delta);
		}

		function onMouseUp() {
			isResizing = false;
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		}

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
	}

	function resetWidth() {
		shellStore.resetWidth();
	}
</script>

<aside class="sidebar glass-sidebar" class:collapsed>
	<!-- Navigation -->
	<nav class="nav-container">
		<!-- Main Nav Items -->
		{#each navGroups as item}
			<a
				href={item.href}
				class="nav-item glass-button"
				class:active={isActive(item.href)}
				onclick={handleNavClick}
			>
				<span class="nav-icon">{item.icon}</span>
				{#if !collapsed}
					<span class="nav-label">{item.label}</span>
				{/if}
			</a>
		{/each}

		<!-- Settings Accordion -->
		<div class="settings-accordion">
			<button
				class="nav-item glass-button settings-header"
				class:active={page.url.pathname.startsWith('/settings')}
				class:expanded={settingsExpanded}
				onclick={toggleSettings}
			>
				<span class="nav-icon">⚙️</span>
				{#if !collapsed}
					<span class="nav-label">Settings</span>
					<span class="expand-chevron" class:rotated={settingsExpanded}>▶</span>
				{/if}
			</button>

			<!-- Accordion Body - pushes content down -->
			<div class="settings-body" class:open={settingsExpanded && !collapsed}>
				<div class="settings-inner">
					{#each settingsItems as item}
						<a
							href={item.href}
							class="nav-item sub-item glass-button"
							class:active={isActive(item.href)}
						>
							<span class="nav-icon">{item.icon}</span>
							<span class="nav-label">{item.label}</span>
						</a>
					{/each}
				</div>
			</div>
		</div>
	</nav>

	<!-- Collapse Toggle -->
	<button class="collapse-btn glass-button" onclick={toggleCollapse}>
		<span class="collapse-icon" class:flipped={collapsed}>◀</span>
	</button>

	<!-- Resize Handle - using button role for interactive element -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="resize-handle"
		class:active={isResizing}
		onmousedown={startResize}
		ondblclick={resetWidth}
		role="slider"
		tabindex="0"
		aria-orientation="vertical"
		aria-label="Resize sidebar"
		aria-valuemin={180}
		aria-valuemax={400}
		aria-valuenow={shellStore.sidebarWidth}
	></div>
</aside>

<style>
	/* Sidebar Container - width controlled by parent grid */
	.sidebar {
		height: 100%;
		display: flex;
		flex-direction: column;
		position: relative;
		overflow: hidden;

		/* Explicit glass sidebar styling */
		--glass-tint: var(--glass-hue-teal, 195);
		background: oklch(6% 0.04 var(--glass-tint) / 0.95);
		backdrop-filter: blur(24px) saturate(200%);
		-webkit-backdrop-filter: blur(24px) saturate(200%);
		border-right: 3px solid oklch(60% 0.15 var(--glass-tint) / 0.5);
		box-shadow:
			4px 0 24px oklch(0% 0 0 / 0.4),
			inset -2px 0 4px oklch(20% 0.08 var(--glass-tint) / 0.5),
			inset 1px 0 1px oklch(75% 0.08 var(--glass-tint) / 0.25);
	}

	/* Resize Handle */
	.resize-handle {
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		width: 6px;
		cursor: col-resize;
		background: transparent;
		transition: background var(--dp-transition-fast, 150ms);
		z-index: 20;
	}

	.resize-handle:hover,
	.resize-handle.active {
		background: var(--dp-accent-primary, oklch(70% 0.18 195));
	}

	/* Navigation Container */
	.nav-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-2, 0.5rem);
		padding: var(--dp-space-3, 0.75rem);
		overflow-y: auto;
		overflow-x: hidden;
	}

	/* Nav Items - glass-button base from recipes */
	.nav-item {
		display: flex;
		align-items: center;
		gap: var(--dp-space-3, 0.75rem);
		padding: var(--dp-space-3, 0.75rem);
		min-height: 44px;
		text-decoration: none;
		color: var(--dp-text-secondary, oklch(78% 0.025 195));
		font-size: var(--dp-text-sm, 0.875rem);
		font-weight: var(--dp-font-medium, 500);
		cursor: pointer;
		width: 100%;
		text-align: left;
	}

	.nav-item:hover {
		color: var(--dp-text-primary, white);
	}

	.nav-item.active {
		background: linear-gradient(
			135deg,
			oklch(from var(--dp-accent-primary) l c h / 0.25) 0%,
			oklch(from var(--dp-accent-primary) calc(l - 0.1) c h / 0.15) 100%
		) !important;
		border-color: var(--dp-accent-primary) !important;
		color: var(--dp-text-primary, white);
		box-shadow:
			var(--dp-glow-sm),
			inset 0 1px 2px var(--dp-glass-highlight);
	}

	.nav-icon {
		font-size: 1.25rem;
		width: 1.5rem;
		text-align: center;
		flex-shrink: 0;
	}

	.nav-label {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Settings Accordion */
	.settings-accordion {
		display: flex;
		flex-direction: column;
	}

	.settings-header {
		position: relative;
	}

	.expand-chevron {
		margin-left: auto;
		font-size: 0.625rem;
		color: var(--dp-text-muted);
		transition: transform var(--dp-transition-fast, 150ms) ease;
	}

	.expand-chevron.rotated {
		transform: rotate(90deg);
	}

	/* Accordion Body - slides down properly */
	.settings-body {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows var(--dp-transition-normal, 200ms) ease;
	}

	.settings-body.open {
		grid-template-rows: 1fr;
	}

	.settings-inner {
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-1, 0.25rem);
		padding-top: var(--dp-space-2, 0.5rem);
	}

	/* Sub-items - indented, smaller */
	.sub-item {
		margin-left: var(--dp-space-4, 1rem);
		padding: var(--dp-space-2, 0.5rem) var(--dp-space-3, 0.75rem);
		min-height: 38px;
		font-size: var(--dp-text-xs, 0.75rem);
		border-left: 2px solid var(--dp-glass-border);
	}

	.sub-item .nav-icon {
		font-size: 1rem;
		width: 1.25rem;
	}

	/* Collapse Button */
	.collapse-btn {
		position: absolute;
		bottom: var(--dp-space-4, 1rem);
		right: -12px;
		width: 24px;
		height: 24px;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		font-size: 0.625rem;
		z-index: 10;
	}

	.collapse-icon {
		transition: transform var(--dp-transition-fast, 150ms) ease;
	}

	.collapse-icon.flipped {
		transform: rotate(180deg);
	}

	/* Collapsed State */
	.collapsed .nav-item {
		justify-content: center;
		padding: var(--dp-space-3, 0.75rem);
	}

	.collapsed .nav-label,
	.collapsed .expand-chevron {
		display: none;
	}

	.collapsed .sub-item {
		display: none;
	}

	.collapsed .settings-body {
		display: none;
	}

	/* Scrollbar */
	.nav-container::-webkit-scrollbar {
		width: 4px;
	}

	.nav-container::-webkit-scrollbar-track {
		background: transparent;
	}

	.nav-container::-webkit-scrollbar-thumb {
		background: var(--dp-glass-border);
		border-radius: var(--dp-radius-full);
	}

	.nav-container::-webkit-scrollbar-thumb:hover {
		background: var(--dp-glass-border-bright);
	}
</style>
