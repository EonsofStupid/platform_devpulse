<script lang="ts">
	/**
	 * Sidebar - Main navigation with status indicators
	 * 
	 * Nav items:
	 * - Dashboard, Chat (popup), Pulse, Thinkspace, Gallery, Voice, 
	 *   Friends, Settings, News, How-to, Media
	 * 
	 * Uses stores for status display
	 */
	import { page } from '$app/stores';
	import { statusStore, voiceStore, projectsStore } from '$lib/stores';
	import { openChatWindow } from '$lib/api';

	interface NavItem {
		href?: string;
		action?: () => void;
		label: string;
		icon: string;
	}

	const navItems: NavItem[] = [
		{ href: '/', label: 'Dashboard', icon: '📊' },
		{ action: () => openChatWindow(), label: 'Chat', icon: '💬' },
		{ href: '/models', label: 'Models', icon: '🤖' },
		{ href: '/projects', label: 'Projects', icon: '📁' },
		{ href: '/pulse', label: 'Pulse', icon: '📈' },
		{ href: '/thinkspace', label: 'Thinkspace', icon: '🧠' },
		{ href: '/gallery', label: 'Gallery', icon: '🖼️' },
		{ href: '/voice', label: 'Voice', icon: '🎤' },
		{ href: '/friends', label: 'Friends', icon: '👥' },
		{ href: '/settings', label: 'Settings', icon: '⚙️' },
		{ href: '/news', label: 'News', icon: '📰' },
		{ href: '/howto', label: 'How-to', icon: '📚' },
		{ href: '/media', label: 'Media', icon: '🎬' },
	];

	function isActive(href?: string): boolean {
		if (!href) return false;
		const pathname = $page.url.pathname;
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}
</script>

<aside class="sidebar">
	<!-- Logo -->
	<div class="logo">
		<span class="logo-icon">⚡</span>
		<span class="logo-text">DevPulse</span>
	</div>

	<!-- Nav -->
	<nav class="nav">
		{#each navItems as item}
			{#if item.href}
				<a 
					href={item.href} 
					class="nav-item" 
					class:active={isActive(item.href)}
				>
					<span class="nav-icon">{item.icon}</span>
					<span class="nav-label">{item.label}</span>
				</a>
			{:else if item.action}
				<button 
					class="nav-item" 
					onclick={item.action}
				>
					<span class="nav-icon">{item.icon}</span>
					<span class="nav-label">{item.label}</span>
				</button>
			{/if}
		{/each}
	</nav>

	<!-- Status Footer -->
	<div class="status-footer">
		<div class="status-row">
			<span class="status-dot" class:healthy={statusStore.aiReady} class:offline={!statusStore.aiReady}></span>
			<span class="status-label">{statusStore.aiReady ? 'AI Ready' : 'AI Loading'}</span>
		</div>
		<div class="status-row">
			<span class="status-dot" class:healthy={voiceStore.status?.tts_ready} class:offline={!voiceStore.status?.tts_ready}></span>
			<span class="status-label">{voiceStore.status?.tts_ready ? 'Voice Ready' : 'No Voice'}</span>
		</div>
		<div class="status-row">
			<span class="status-label projects">Projects: {projectsStore.count}</span>
		</div>
	</div>
</aside>

<style>
	.sidebar {
		width: 220px;
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(12px);
		border-right: 1px solid rgba(255, 255, 255, 0.1);
		padding: 1rem;
	}

	/* Logo */
	.logo {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.logo-icon {
		font-size: 1.5rem;
	}

	.logo-text {
		font-size: 1.25rem;
		font-weight: 700;
		background: linear-gradient(135deg, #60a5fa, #a78bfa);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* Nav */
	.nav {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		overflow-y: auto;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 0.75rem;
		border-radius: 0.5rem;
		color: rgba(255, 255, 255, 0.6);
		text-decoration: none;
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 0.9375rem;
		font-family: inherit;
		transition: all 0.15s ease;
		width: 100%;
		text-align: left;
	}

	.nav-item:hover {
		background: rgba(255, 255, 255, 0.05);
		color: white;
	}

	.nav-item.active {
		background: rgba(255, 255, 255, 0.1);
		color: white;
		border-left: 2px solid #60a5fa;
	}

	.nav-icon {
		font-size: 1.125rem;
		width: 1.5rem;
		text-align: center;
	}

	/* Status Footer */
	.status-footer {
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.status-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #666;
	}

	.status-dot.healthy {
		background: #22c55e;
		box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
	}

	.status-dot.offline {
		background: #666;
	}

	.status-label.projects {
		color: #60a5fa;
	}

	/* Scrollbar */
	.nav::-webkit-scrollbar {
		width: 4px;
	}

	.nav::-webkit-scrollbar-track {
		background: transparent;
	}

	.nav::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
	}
</style>
