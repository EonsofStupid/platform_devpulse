<script lang="ts">
import Frame from "$lib/layouts/app/Frame.svelte";
import VPB from "$lib/sys/debug/vpb/VPB.svelte";

let { children } = $props();
</script>

<Frame>
  {@render children()}
</Frame>

<VPB />
