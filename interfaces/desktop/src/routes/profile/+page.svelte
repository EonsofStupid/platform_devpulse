<!--
	@route /profile
	@description Post-login profile screen — Clyffy's embedder picker
	             + minion read-only section. Reachable from the
	             post-login surfaces (header link, dashboard CTA, etc.
	             — those wire in follow-up slices). Today the operator
	             types the URL or navigates programmatically.

	The route is auth-gated via the root layout's `authState.phase`
	check, so this file doesn't need to re-implement the gate — by
	the time SvelteKit renders us, the user is signed in.
-->
<script lang="ts">
import { EmbedderPicker } from "$lib/domains/profile/index.js";
</script>

<main class="profile-route">
	<EmbedderPicker />
</main>

<style>
	.profile-route {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		min-height: 100vh;
		padding: var(--space-24) var(--space-16);
		background: var(--surface-base);
	}
</style>
