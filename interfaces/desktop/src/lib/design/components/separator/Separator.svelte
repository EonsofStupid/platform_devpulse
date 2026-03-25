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
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { useSeparator } from "$lib/design/primitives/separator/use-separator.svelte.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { SeparatorProps, SeparatorOrientation } from "./types.js";

const ORIENTATION_CLASSES: Record<SeparatorOrientation, string> = {
	horizontal: "h-px w-full",
	vertical: "w-px h-full",
};

let {
	orientation = "horizontal",
	decorative = false,
	variant = "solid",
	class: className,
	...rest
}: SeparatorProps = $props();

const separator = $derived(useSeparator({ orientation, decorative }));
const styleId = "separator-default";
</script>

<StyleMacro kind="separator" style={styleId}>
	<hr
		{...separator.root}
		data-kind="separator"
		data-slot="root"
		data-orientation={orientation}
		data-variant={variant}
		class={cn(ORIENTATION_CLASSES[orientation] ?? ORIENTATION_CLASSES.horizontal, className)}
		{...rest}
	/>
</StyleMacro>
