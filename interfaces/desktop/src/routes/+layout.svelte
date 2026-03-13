<script lang="ts">
import "../app.css";
import "$lib/design/index.js";
import SvgFilters from "$lib/design/svg/filters/SvgFilters.svelte";
import BootOverlay from "$lib/layouts/app/BootOverlay.svelte";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";
import { onMount } from "svelte";

let { children } = $props();

onMount(() => {
	platformState.init();
	return () => platformState.destroy();
});
</script>

<SvgFilters />
<BootOverlay />
{@render children()}
