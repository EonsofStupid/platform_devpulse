<!--
	@component Separator
	@kind separator
	@layer components

	Horizontal or vertical divider. Hook (ARIA) + StyleMacro (visual).
	Decorative separators are aria-hidden. Semantic ones use role="separator".
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
