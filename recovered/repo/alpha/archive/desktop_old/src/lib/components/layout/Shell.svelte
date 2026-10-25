<script lang="ts">
	/**
	 * Shell - Main app layout wrapper
	 *
	 * Layout per DESKTOP_MUST_HAVES.md:
	 * - 52px IconSidebar (left, fixed)
	 * - 66px TopBar (top, fixed)
	 * - 52px StatusBar (bottom, fixed)
	 * - Main content fills remaining space
	 */
	import IconSidebar from './IconSidebar.svelte';
	import TopBar from './TopBar.svelte';
	import StatusBar from './StatusBar.svelte';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();
	let sidebarExpanded = $state(false);

	function toggleSidebar() {
		sidebarExpanded = !sidebarExpanded;
	}
</script>

<div class="shell">
	<IconSidebar />
	<TopBar onMenuToggle={toggleSidebar} />
	<main class="main-content">
		{@render children()}
	</main>
	<StatusBar />
</div>

<style>
	.shell {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background: var(--color-bg-primary, #0a0a0a);
	}

	.main-content {
		flex: 1;
		margin-left: 52px; /* IconSidebar width */
		margin-top: 66px; /* TopBar height */
		margin-bottom: 52px; /* StatusBar height */
		overflow: auto;
		display: flex;
		flex-direction: column;
	}

	/* Custom scrollbar */
	.main-content::-webkit-scrollbar {
		width: 8px;
	}

	.main-content::-webkit-scrollbar-track {
		background: transparent;
	}

	.main-content::-webkit-scrollbar-thumb {
		background: var(--color-border, #333);
		border-radius: 4px;
	}

	.main-content::-webkit-scrollbar-thumb:hover {
		background: var(--color-text-secondary, #666);
	}
</style>
