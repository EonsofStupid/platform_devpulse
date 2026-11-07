<script lang="ts">
	/**
	 * Root Layout - App shell with store initialization
	 * Chat opens in separate Tauri window (lightweight, Steam-style)
	 */
	import '../app.css';
	import { onMount } from 'svelte';
	import { Shell } from '$lib/components/layout';
	import { MaestroFab } from '$lib/components/chat';
	import { initApp } from '$lib/services';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	onMount(() => {
		initApp();
	});
</script>

<Shell>
	{@render children()}
</Shell>

<!-- Maestro FAB - Opens separate chat window (Ctrl+G) -->
<MaestroFab />
