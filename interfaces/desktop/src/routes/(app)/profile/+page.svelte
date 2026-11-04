<!--
	@route /profile
	@description Profile — the embedder picker plus a read-only helper-status
	             section. Opened from the top bar's avatar (plan 0008 R18);
	             it renders in the app frame, which supplies the page's
	             landmark, padding and surface, and is not a sidebar hub
	             (`_nav.placement: "hidden"`).

	The route is auth-gated via the root layout's `authState.phase`
	check, so this file doesn't need to re-implement the gate — by
	the time SvelteKit renders us, the user is signed in.
-->
<script lang="ts">
import { EmbedderPicker } from "#lib/domains/profile/index.js";
</script>

<EmbedderPicker />
