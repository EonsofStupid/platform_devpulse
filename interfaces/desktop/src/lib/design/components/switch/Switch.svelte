<!--
	@component Switch
	@kind switch
	@layer components

	ColdLight Switch — builder-driven component.
	Builder owns ALL ARIA semantics. Component adds recipe classes.
	Reference: WAI-ARIA APG Switch Pattern
-->
<script lang="ts">
	import type { SwitchComponentProps } from "./types.js";
	import { createSwitch } from "$lib/design/api/adapters/coldlight/_internal/switch/index.js";
	import SwitchRoot from "$lib/design/primitives/switch/Switch.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { switchRecipe, switchThumbRecipe } from "./recipe.js";

	let {
		size = "md",
		checked = false,
		disabled = false,
		onCheckedChange,
		children,
		class: className,
		...rest
	}: SwitchComponentProps = $props();

	const builder = createSwitch({
		checked: () => checked,
		disabled: () => disabled,
		onCheckedChange: (v: any) => onCheckedChange?.(v),
	});

	const classes = $derived(cn(switchRecipe({ size }), className));
	const thumbClasses = $derived(switchThumbRecipe({ size, checked }));
</script>

<SwitchRoot
	{...builder.root}
	{...rest}
	class={classes}
>
	<span {...builder.thumb} class={thumbClasses} data-slot="thumb"></span>
	{@render children?.()}
</SwitchRoot>
