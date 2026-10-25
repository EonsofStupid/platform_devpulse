<script lang="ts">
	/**
	 * IconSidebar - 52px icon-only sidebar
	 * 
	 * Per DESKTOP_MUST_HAVES.md spec:
	 * - 52px width
	 * - Icons only (no text labels)
	 * - Tooltips on hover
	 */
	import { page } from '$app/stores';
	import { openChatWindow } from '$lib/api';

	interface NavItem {
		href?: string;
		action?: () => void;
		label: string;
		icon: string;
	}

	const navItems: NavItem[] = [
		{ href: '/', label: 'Dashboard', icon: '🏠' },
		{ href: '/projects', label: 'Projects', icon: '📁' },
		{ href: '/models', label: 'Models', icon: '🤖' },
		{ href: '/pulse', label: 'Docs', icon: '📚' },
		{ href: '/gallery', label: 'Gallery', icon: '🖼️' },
		{ href: '/voice', label: 'Voice', icon: '🎙️' },
		{ href: '/settings', label: 'Settings', icon: '⚙️' },
	];

	function isActive(href?: string): boolean {
		if (!href) return false;
		const pathname = $page.url.pathname;
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}
</script>

<aside class="icon-sidebar">
	<div class="nav-top">
		{#each navItems as item}
			{#if item.href}
				<a 
					href={item.href} 
					class="nav-icon-btn" 
					class:active={isActive(item.href)}
					title={item.label}
				>
					<span class="icon">{item.icon}</span>
				</a>
			{:else if item.action}
				<button 
					class="nav-icon-btn" 
					onclick={item.action}
					title={item.label}
				>
					<span class="icon">{item.icon}</span>
				</button>
			{/if}
		{/each}
	</div>

	<div class="nav-bottom">
		<button 
			class="nav-icon-btn chat-btn" 
			onclick={() => openChatWindow()}
			title="Open Chat"
		>
			<span class="icon">💬</span>
		</button>
	</div>
</aside>

<style>
	.icon-sidebar {
		width: 52px;
		height: 100vh;
		position: fixed;
		left: 0;
		top: 0;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(12px);
		border-right: 1px solid rgba(255, 255, 255, 0.1);
		padding: 0.5rem 0;
		z-index: 150;
	}

	.nav-top, .nav-bottom {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.nav-icon-btn {
		width: 42px;
		height: 42px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		border-radius: 10px;
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		font-size: 1.25rem;
		transition: all 0.15s ease;
		text-decoration: none;
		position: relative;
	}

	.nav-icon-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
	}

	.nav-icon-btn.active {
		background: rgba(99, 102, 241, 0.2);
		color: #818cf8;
	}

	.nav-icon-btn.active::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 3px;
		height: 24px;
		background: #6366f1;
		border-radius: 0 2px 2px 0;
	}

	.chat-btn {
		background: rgba(34, 197, 94, 0.15);
		border: 1px solid rgba(34, 197, 94, 0.3);
		color: #22c55e;
	}

	.chat-btn:hover {
		background: rgba(34, 197, 94, 0.25);
	}

	/* Tooltip */
	.nav-icon-btn::after {
		content: attr(title);
		position: absolute;
		left: 100%;
		top: 50%;
		transform: translateY(-50%);
		margin-left: 8px;
		padding: 0.4rem 0.6rem;
		background: rgba(0, 0, 0, 0.9);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		font-size: 0.75rem;
		color: #fff;
		white-space: nowrap;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.15s ease;
		z-index: 200;
	}

	.nav-icon-btn:hover::after {
		opacity: 1;
	}
</style>
