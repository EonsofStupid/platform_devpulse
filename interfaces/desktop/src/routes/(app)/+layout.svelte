<script lang="ts">
import ChatOverlay from "$lib/layouts/app/ChatOverlay.svelte";
import Frame from "$lib/layouts/app/Frame.svelte";
import { __DEV__ } from "$lib/sys/debug/DEBUG_FLAG.js";
import { Vpb } from "$lib/sys/debug/vpb/index.js";

let { children } = $props();
let vpbOpen = $state(false);
let chatOpen = $state(false);

function onKeydown(e: KeyboardEvent) {
	if (e.ctrlKey && e.shiftKey && e.key === "B") {
		e.preventDefault();
		vpbOpen = !vpbOpen;
	}
	if (e.ctrlKey && e.shiftKey && e.key === "C") {
		e.preventDefault();
		chatOpen = !chatOpen;
	}
}
</script>

<svelte:window onkeydown={onKeydown} />

<Frame>
	{@render children()}
</Frame>

<ChatOverlay bind:open={chatOpen} />

{#if __DEV__}
	<Vpb bind:open={vpbOpen} />
{/if}
