<!--
  @component Surface
  @kind surface
  @layer primitive
  @category layout
  @description Universal semantic container. Renders as div, section, article, aside,
  main, footer, header, or nav. StyleMacro paints via data-kind="surface".
  @element svelte:element
  @slots root
  @spec surface.spec.ts
-->
<script lang="ts">
import { enforceSlot } from "#coldlight/schema/enforce.js";
import { cn } from "#coldlight/utils/cn.js";
import { surfaceSpec } from "./surface.spec.js";
import type { SurfacePrimitiveProps } from "./types.js";

let { children, class: className, as = "div", ...rest }: SurfacePrimitiveProps = $props();

let rootEl: HTMLElement | undefined = $state();

$effect(() => {
	if (import.meta.env.DEV && rootEl) {
		enforceSlot(rootEl, surfaceSpec, "root");
	}
});
</script>

<svelte:element
	this={as}
	bind:this={rootEl}
	data-kind="surface"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</svelte:element>
