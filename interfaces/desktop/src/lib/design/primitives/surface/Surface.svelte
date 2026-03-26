<!--
  @component Surface
  @kind surface
  @layer primitive
  @category structural
  @description Styled rectangle container — the universal visual building block.
  Renders a div with data-kind="surface" for StyleMacro to paint.
  Accepts background, border, shadow, radius, blur via CSS custom properties.
  Every Card, Panel, Widget, Dialog content — they all compose this.

  @element div
  @slots root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

interface SurfaceProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
	children?: Snippet;
	class?: string;
	/** HTML element to render as. Default: div */
	as?: "div" | "section" | "article" | "aside" | "main" | "footer" | "header";
}

let {
	children,
	class: className,
	as = "div",
	...rest
}: SurfaceProps = $props();
</script>

<svelte:element
	this={as}
	data-kind="surface"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</svelte:element>
