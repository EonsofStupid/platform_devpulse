<script lang="ts">
let { children } = $props();
</script>

<div class="h-screen w-screen overflow-hidden font-sans" data-layout="devtools">
	{@render children()}
</div>
