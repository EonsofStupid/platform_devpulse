<script lang="ts">
import "../app.css";
import "$lib/design/index.js";
import SvgFilters from "$lib/design/svg/filters/SvgFilters.svelte";
import { platformHealth } from "$lib/sys/runes/health.svelte.js";
import { onMount } from "svelte";

let { children } = $props();

onMount(() => {
	platformHealth.startPolling();
	return () => platformHealth.stopPolling();
});
</script>

<SvgFilters />
{@render children()}
