<script lang="ts">
let { children } = $props();
</script>

<!-- Devtools window root = its cqi container seam (S1.C adoption
     contract). Without it every fluid-token consumer in this window
     silently resolved against the small viewport. Full-window geometry,
     so re-anchored absolute/fixed descendants are unaffected. -->
<div
	class="h-screen w-screen overflow-hidden font-sans [container-type:inline-size] [container-name:devtools]"
	data-layout="devtools"
>
	{@render children()}
</div>
