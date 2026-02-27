<!--
	@component VisuallyHidden
	@kind visually-hidden
	@layer components

	ColdLight VisuallyHidden — pure CSS utility component.
	Renders content that is visually hidden but accessible to screen readers.
	Uses the sr-only pattern (position: absolute, clip, etc.).
	No builder, no transport — CSS only.
-->
<script lang="ts">
	import type { VisuallyHiddenComponentProps } from "./types.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { visuallyHiddenRecipe } from "./recipe.js";

	let {
		as = "span",
		children,
		class: className,
		...rest
	}: VisuallyHiddenComponentProps = $props();

	const classes = $derived(cn(visuallyHiddenRecipe(), className));
</script>

{#if as === "div"}
	<div
		{...rest}
		class={classes}
		data-kind="visually-hidden"
		data-slot="root"
	>
		{@render children?.()}
	</div>
{:else}
	<span
		{...rest}
		class={classes}
		data-kind="visually-hidden"
		data-slot="root"
	>
		{@render children?.()}
	</span>
{/if}
