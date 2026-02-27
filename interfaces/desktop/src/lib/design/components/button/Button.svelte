<!--
	@component Button
	@kind button
	@layer components

	ColdLight Button — builder-driven component.
	Builder owns ALL ARIA semantics. Component adds recipe classes.
	Reference: WAI-ARIA APG Button Pattern
-->
<script lang="ts">
	import type { ButtonComponentProps } from "./types.js";
	import { createButton } from "$lib/design/api/adapters/coldlight/_internal/button/index.js";
	import ButtonRoot from "$lib/design/primitives/button/Button.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { buttonRecipe } from "./recipe.js";

	let {
		intent = "primary",
		size = "md",
		pressed,
		onPressedChange,
		loading = false,
		disabled = false,
		expanded,
		children,
		class: className,
		...rest
	}: ButtonComponentProps = $props();

	const builder = createButton({
		disabled: () => disabled,
		pressed: () => pressed,
		loading: () => loading,
		expanded: () => expanded,
		onPressedChange,
	});

	const classes = $derived(cn(buttonRecipe({ intent, size }), className));
</script>

<ButtonRoot
	{...builder.root}
	{...rest}
	class={classes}
>
	{@render children?.()}
</ButtonRoot>
