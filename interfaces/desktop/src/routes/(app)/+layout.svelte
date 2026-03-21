<script lang="ts">
import ChatOverlay from "$lib/layouts/app/ChatOverlay.svelte";
import Frame from "$lib/layouts/app/Frame.svelte";

let { children } = $props();
let chatOpen = $state(false);

function onKeydown(e: KeyboardEvent) {
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
