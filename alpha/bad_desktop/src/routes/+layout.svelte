<script lang="ts">
	/**
	 * Root Layout - App shell with store initialization
	 * Chat window detects its context and skips Shell
	 */
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { QueryClientAdapter } from '@tanstack/svelte-query';
	import { Shell } from '$lib/layout';
	import { MaestroFab } from '$lib/domains/chat';
	import { initApp, queryClient } from '$lib/services';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	// Detect if we're in the chat window (separate Tauri window)
	// Chat window loads /domains/chat route - NO sidebar, NO shell
	let isChatWindow = $derived($page.url.pathname.startsWith('/domains/chat'));

	onMount(() => {
		initApp();
	});
</script>

<QueryClientAdapter client={queryClient}>
	{#if isChatWindow}
		<!-- Chat window: No shell, just content -->
		{@render children()}
	{:else}
		<!-- Main window: Full shell with sidebar -->
		<Shell>
			{@render children()}
		</Shell>

		<!-- Maestro FAB - Opens separate chat window (Ctrl+G) -->
		<MaestroFab />
	{/if}
</QueryClientAdapter>
