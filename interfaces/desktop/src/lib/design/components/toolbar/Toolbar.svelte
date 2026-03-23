<!--
	@component Toolbar
	@kind toolbar
	@layer components

	ColdLight Toolbar — builder-driven, 8-axis visual system.
	Builder owns ALL ARIA. StyleMacro provides visual styling.
-->
<script lang="ts">
import { createToolbar } from "$lib/design/api/dsadapters/coldlight/_internal/toolbar/index.js";
import ToolbarRoot from "$lib/design/primitives/toolbar/Toolbar.svelte";
import { cn } from "$lib/design/utils/cn.js";
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

const classes = $derived(
	cn(toolbarRecipe({ size, orientation }), className));
</script>

<ToolbarRoot
	{...builder.root}
	{...rest}
	class={classes}
>
	{@render children?.()}
</ToolbarRoot>
