<script lang="ts">
import Frame from "$lib/layouts/app/Frame.svelte";

let { children } = $props();
</script>

<Frame>
	{@render children()}
</Frame>
