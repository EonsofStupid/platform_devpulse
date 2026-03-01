<script lang="ts">
import "../app.css";
import "$lib/design/index.js";
import SvgFilters from "$lib/design/svg/filters/SvgFilters.svelte";

let { children } = $props();
</script>

<SvgFilters />
{@render children()}
