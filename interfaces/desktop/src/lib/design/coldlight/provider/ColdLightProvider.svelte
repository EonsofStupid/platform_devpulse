<!--
	@component ColdLightProvider
	@description Theme provider for ColdLight design system.

	Wraps children with theme context. Sets data attributes
	for accent color and color scheme. CSS custom properties
	flow from SD5-generated tokens — the provider controls
	WHICH set is active via data attributes, not inline vars.

	SVG filters mounted separately (SvgFilters.svelte in root layout).
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { ColdLightProviderProps } from "./types.js";
	import { setColdLightTheme } from "./context.svelte.js";

	let { theme = {}, children }: ColdLightProviderProps & { children: Snippet } = $props();

	const resolved = $derived(setColdLightTheme(theme));
</script>

<div
	data-coldlight-provider
	data-accent={resolved.accent}
	data-scheme={resolved.colorScheme}
	data-neumorphism={resolved.neumorphism ? "on" : "off"}
	data-animations={resolved.animations ? "on" : "off"}
	data-scale={resolved.scale}
	class="contents"
>
	{@render children()}
</div>
