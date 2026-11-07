<script lang="ts">
	import '../app.css';
	import Shell from '$lib/components/layout/Shell.svelte';
	import { signalStore } from '$lib/stores/signals.svelte';
	import { backgroundStore } from '$lib/stores/background.svelte';
	import { onMount } from 'svelte';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	// Auto-connect to signal stream and start background polling on mount
	onMount(() => {
		signalStore.connect();
		backgroundStore.startPolling();

		return () => {
			signalStore.disconnect();
			backgroundStore.stopPolling();
		};
	});
</script>

<Shell>
	{@render children()}
</Shell>
