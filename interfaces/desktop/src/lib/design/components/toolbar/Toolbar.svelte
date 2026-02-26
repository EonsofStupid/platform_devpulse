<!--
	@component Toolbar
	@kind toolbar
	@layer components
	ColdLight Toolbar — builder-driven. Builder owns ARIA. Component adds recipe.
-->
<script lang="ts">
	import type { ToolbarComponentProps } from "./types.js";
	import { createToolbar } from "$lib/design/builders/toolbar/index.js";
	import ToolbarRoot from "$lib/design/primitives/toolbar/Toolbar.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { toolbarRecipe } from "./recipe.js";

	let {
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
		get label() { return label; },
		get orientation() { return orientation; },
		get disabled() { return disabled; },
		get loop() { return loop; },
	});

	const classes = $derived(cn(toolbarRecipe({ size, orientation }), className));
</script>

<ToolbarRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</ToolbarRoot>
