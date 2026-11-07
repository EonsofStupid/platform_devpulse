<script lang="ts">
	/**
	 * Shell - Main app layout wrapper
	 *
	 * Grid layout: Topbar | Sidebar + Content | Statusbar
	 * Uses shellStore to control sidebar width
	 */
	import Topbar from './Topbar.svelte';
	import Sidebar from './Sidebar.svelte';
	import Statusbar from './Statusbar.svelte';
	import { CyberBackground } from '$lib/shared/ui';
	import { shellStore } from '../stores/shell.svelte';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	// Bind sidebar width to grid
	let sidebarWidth = $derived(shellStore.sidebarWidth);
</script>

<!-- Global Cyber Background -->
<CyberBackground />

<!-- App Shell Grid -->
<div class="shell" style:--sidebar-width="{sidebarWidth}rem">
	<Topbar />
	<Sidebar />
	<main class="main-content">
		{@render children()}
	</main>
	<Statusbar />
</div>

<style>
	.shell {
		display: grid;
		grid-template-areas:
			"topbar topbar"
			"sidebar content"
			"statusbar statusbar";
		grid-template-columns: var(--sidebar-width, var(--dp-sidebar-expanded)) 1fr;
		grid-template-rows: var(--dp-topbar-height) 1fr var(--dp-statusbar-height);
		height: 100vh;
		position: relative;
		overflow: hidden;
	}

	/* Grid Area Assignments */
	.shell > :global(header.topbar) {
		grid-area: topbar;
		z-index: 10;
	}

	.shell > :global(aside.sidebar),
	.shell > :global(aside) {
		grid-area: sidebar;
		z-index: 10;
	}

	.shell > :global(footer.statusbar) {
		grid-area: statusbar;
		z-index: 10;
	}

	.main-content {
		grid-area: content;
		overflow: auto;
		display: flex;
		flex-direction: column;
		position: relative;
		z-index: 5;
		padding: var(--dp-space-4, 1rem);
	}

	/* Custom scrollbar */
	.main-content::-webkit-scrollbar {
		width: 8px;
	}

	.main-content::-webkit-scrollbar-track {
		background: transparent;
	}

	.main-content::-webkit-scrollbar-thumb {
		background: var(--dp-glass-border);
		border-radius: var(--dp-radius-full);
	}

	.main-content::-webkit-scrollbar-thumb:hover {
		background: var(--dp-glass-border-bright);
	}
</style>
