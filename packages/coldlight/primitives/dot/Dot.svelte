<!--
  @component Dot
  @kind dot
  @layer primitive
  @category structural
  @description Colored circle indicator. The simplest visual atom.
  @element span
  @slots root
  @spec dot.spec.ts
-->
<script lang="ts">
import { enforceSlot } from "#coldlight/schema/enforce.js";
import { cn } from "#coldlight/utils/cn.js";
import { dotSpec } from "./dot.spec.js";
import type { DotPrimitiveProps } from "./types.js";

let {
	class: className,
	size = "0.5rem",
	color = "currentColor",
	glow = false,
	animate = false,
	...rest
}: DotPrimitiveProps = $props();

let rootEl: HTMLSpanElement | undefined = $state();

$effect(() => {
	if (import.meta.env.DEV && rootEl) {
		enforceSlot(rootEl, dotSpec, "root");
	}
});
</script>

<span
	bind:this={rootEl}
	data-kind="dot"
	data-slot="root"
	class={cn(
		"inline-block rounded-full shrink-0",
		animate && "animate-pulse",
		className,
	)}
	style="width: {size}; height: {size}; background: {color};{glow ? ` box-shadow: 0 0 0.375rem ${color};` : ''}"
	aria-hidden="true"
	{...rest}
></span>
