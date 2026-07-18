<!--
	@component Prose
	@kind prose
	@layer component
	@category content
	@description Rich text container with typographic defaults for rendering long-form markdown or HTML content
	@container true
	@containerSlots root
	@compound false
	@blockCategory content
	@defaultStyle prose-default
	@styleIds prose-default
	@requiredAxes typography, color
	@slots root:all
	@defaults {
		"background-color": "transparent",
		"box-shadow": "none",
		"border-width": "0",
		"color": "var(--text-primary)"
}
-->
<script lang="ts">
import type { ProseSize } from "$lib/design/behaviors/display/prose/index.js";
import { proseAnatomy } from "$lib/design/behaviors/display/prose/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ProseProps } from "./types.js";

const SIZE: Record<ProseSize, string> = {
	sm: "prose-sm",
	base: "prose",
	lg: "prose-lg",
	xl: "prose-xl",
};

let {
	size = "base",
	preset = "default",
	children,
	class: className,
	...rest
}: ProseProps = $props();
const m = $derived(renderForge({ kind: "prose", preset }));
</script>

<div
		{...proseAnatomy.attrs.root}
		{...m.dataAttrs}
		style={cssVarString(m.cssVars)}
		class={cn(SIZE[size] ?? SIZE.base, className)}
		{...rest}
	>
		{@render children?.()}
	</div>
