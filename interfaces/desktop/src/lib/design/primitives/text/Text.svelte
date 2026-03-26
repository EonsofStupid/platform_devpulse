<!--
  @component TextPrimitive
  @kind text
  @layer primitive
  @category structural
  @description Styled text span — the universal text building block.
  Renders a span (or p, strong, em, small) with data-kind="text".
  Size, weight, color, family applied via class or CSS custom properties.

  @element span
  @slots root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

interface TextPrimitiveProps extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children"> {
	children?: Snippet;
	class?: string;
	as?: "span" | "p" | "strong" | "em" | "small" | "div";
}

let {
	children,
	class: className,
	as = "span",
	...rest
}: TextPrimitiveProps = $props();
</script>

<svelte:element
	this={as}
	data-kind="text"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</svelte:element>
