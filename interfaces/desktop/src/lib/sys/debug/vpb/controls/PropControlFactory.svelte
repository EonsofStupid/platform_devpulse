<!--
	@file PropControlFactory — Maps DsSurfaceProps fields to controls
	@layer vpb

	Entry point for the properties panel. Renders the correct control
	for each DsSurfaceProps field.
-->
<script lang="ts">
	import type { DsSurfaceProps } from "$lib/design/recipes/types.js";
	import SurfaceControl from "./SurfaceControl.svelte";
	import VariantControl from "./VariantControl.svelte";
	import DepthControl from "./DepthControl.svelte";
	import SizeControl from "./SizeControl.svelte";
	import RadiusControl from "./RadiusControl.svelte";
	import AccentControl from "./AccentControl.svelte";
	import GlowControl from "./GlowControl.svelte";
	import BevelControl from "./BevelControl.svelte";

	let {
		props,
		onchange,
	}: {
		props: Partial<DsSurfaceProps>;
		onchange: (key: string, value: unknown) => void;
	} = $props();
</script>

<div class="vpb-controls">
	<SurfaceControl value={props.surface ?? "glass"} onchange={(v) => onchange("surface", v)} />
	{#if (props.surface ?? "glass") === "glass"}
		<VariantControl value={props.variant ?? "void"} onchange={(v) => onchange("variant", v)} />
	{/if}
	<AccentControl value={props.accent ?? "teal"} onchange={(v) => onchange("accent", v)} />
	<DepthControl value={props.depth ?? 2} onchange={(v) => onchange("depth", v)} />
	<SizeControl value={props.size ?? "md"} onchange={(v) => onchange("size", v)} />
	<RadiusControl value={props.radius ?? "md"} onchange={(v) => onchange("radius", v)} />
	<GlowControl value={props.glow ?? "off"} onchange={(v) => onchange("glow", v)} />
	<BevelControl value={props.bevel ?? "off"} onchange={(v) => onchange("bevel", v)} />
</div>

<style>
	.vpb-controls {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
</style>
