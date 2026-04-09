<script lang="ts">
let { children } = $props();
</script>

<div class="h-screen w-screen overflow-hidden" data-layout="setup">
	{@render children()}
</div>
