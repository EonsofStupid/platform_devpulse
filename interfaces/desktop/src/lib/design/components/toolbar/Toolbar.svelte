<!--
	@component Toolbar
	@kind toolbar
	@layer components

	ColdLight Toolbar — builder-driven, 8-axis visual system.
	Builder owns ALL ARIA. useColdLight() resolves visual props.
-->
<script lang="ts">
import { createToolbar } from "$lib/design/api/dsadapters/coldlight/_internal/toolbar/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import ToolbarRoot from "$lib/design/primitives/toolbar/Toolbar.svelte";
import { cn } from "$lib/design/primitives/types.js";
import { toolbarRecipe } from "./recipe.js";
import type { ToolbarComponentProps } from "./types.js";

let {
	// Kind-specific props
	size = "md",
	orientation = "horizontal",
	label,
	disabled = false,
	loop = true,
	children,
	class: className,
	// ColdLight 8-axis props
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	// Rest spread
	...rest
}: ToolbarComponentProps = $props();

const builder = createToolbar({
	get label() {
		return label;
	},
	get orientation() {
		return orientation;
	},
	get disabled() {
		return disabled;
	},
	get loop() {
		return loop;
	},
});

const visual = useColdLight(() => ({
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	size,
}));

const classes = $derived(
	cn(toolbarRecipe({ size, orientation }), visual.segments, visual.radius, className),
);
</script>

<ToolbarRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</ToolbarRoot>
