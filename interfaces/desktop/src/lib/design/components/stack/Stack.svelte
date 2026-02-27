<!--
	@component Stack
	@kind stack
	@layer components

	ColdLight Stack — builder-driven vertical flex container.
	Builder provides data attributes. Component adds recipe classes (gap, align).
-->
<script lang="ts">
	import type { StackComponentProps } from "./types.js";
	import { createStack } from "$lib/design/api/adapters/coldlight/_internal/stack/index.js";
	import StackRoot from "$lib/design/primitives/stack/Stack.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { stackRecipe } from "./recipe.js";

	let {
		gap,
		align,
		children,
		class: className,
		...rest
	}: StackComponentProps = $props();

	const builder = createStack();
	const classes = $derived(cn(stackRecipe({ gap, align }), className));
</script>

<StackRoot
	{...builder.root}
	{...rest}
	class={classes}
>
	{@render children?.()}
</StackRoot>
