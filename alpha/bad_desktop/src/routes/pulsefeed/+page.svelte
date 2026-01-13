<script lang="ts">
	/**
	 * /pulsefeed - Redirect to Pulse domain
	 */
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/domains/global/pulse', { replaceState: true });
	});
</script>

<div class="redirect-notice">
	<p>Redirecting to Pulse...</p>
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
