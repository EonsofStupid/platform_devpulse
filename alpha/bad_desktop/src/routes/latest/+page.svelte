<script lang="ts">
	/**
	 * /latest - Redirect to News feed
	 */
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/domains/global/pulse/news', { replaceState: true });
	});
</script>

<div class="redirect-notice">
	<p>Redirecting to Latest...</p>
</div>

<style>
	.redirect-notice {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100vh;
		color: rgba(255, 255, 255, 0.6);
	}
</style>
