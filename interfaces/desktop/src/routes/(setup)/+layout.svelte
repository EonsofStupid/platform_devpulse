<script lang="ts">
import { DynamicBackground } from "$lib/design/components/dynamic-background/index.js";

let { children } = $props();
</script>

<DynamicBackground variant="boot" animated />

<div class="relative h-screen w-screen overflow-auto" data-layout="setup">
	{@render children()}
</div>
