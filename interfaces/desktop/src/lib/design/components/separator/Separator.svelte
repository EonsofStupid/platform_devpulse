<!--
	@component Separator
	@kind separator
	@layer component
	@category structural
	@description Horizontal or vertical divider line for visually separating content sections
	@container false
	@compound false
	@blockCategory layout
	@defaultStyle separator-default
	@styleIds separator-default
	@requiredAxes backgroundColor, border
	@slots root:all
	@defaults {
		"background-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"box-shadow": "none",
		"border-width": "0"
}
-->
<script lang="ts">
import { separatorAnatomy } from "$lib/design/behaviors/display/separator/index.js";
import { useSeparator } from "$lib/design/behaviors/display/separator/use-separator.svelte.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { SeparatorOrientation, SeparatorProps } from "./types.js";

const ORIENTATION_CLASSES: Record<SeparatorOrientation, string> = {
	horizontal: "h-px w-full",
	vertical: "w-px h-full",
};

let {
	orientation = "horizontal",
	decorative = false,
	variant = "solid",
	preset = "default",
	class: className,
	...rest
}: SeparatorProps = $props();

const separator = $derived(useSeparator({ orientation, decorative }));
const m = $derived(renderForge({ kind: "separator", preset }));
</script>

<hr
		{...separatorAnatomy.attrs.root}
		{...separator.root}
		{...rest}
		{...m.dataAttrs}
		style={cssVarString(m.cssVars)}
		data-orientation={orientation}
		data-variant={variant}
		class={cn(ORIENTATION_CLASSES[orientation] ?? ORIENTATION_CLASSES.horizontal, className)}
	/>
