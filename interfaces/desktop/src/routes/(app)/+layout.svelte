<script lang="ts">
import Frame from "$lib/layouts/app/Frame.svelte";
import { Vpb } from "$lib/sys/debug/vpb/index.js";
import { __DEV__ } from "$lib/sys/debug/DEBUG_FLAG.js";

let { children } = $props();
let vpbOpen = $state(false);

function onKeydown(e: KeyboardEvent) {
	if (e.ctrlKey && e.shiftKey && e.key === "B") {
		e.preventDefault();
		vpbOpen = !vpbOpen;
	}
}
</script>

<svelte:window onkeydown={onKeydown} />

<Frame>
	{@render children()}
</Frame>

{#if __DEV__}
	<Vpb bind:open={vpbOpen} />
{/if}
