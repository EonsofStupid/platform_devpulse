<!--
	@component InlineMessage
	@kind inline-message
	@layer components

	ColdLight InlineMessage — wraps structureless InlineMessage primitive with:
	- ARIA attributes (role="status", aria-live="polite")
	- Data-state derivation (tone-driven)
	- SD5 token-driven recipe (tone)

	ColdLight OWNS all ARIA. Primitive is structural only.
-->
<script lang="ts">
	import type { InlineMessageComponentProps } from "./types.js";
	import { createInlineMessage } from "$lib/design/builders/inline-message/index.js";
	import InlineMessageRoot from "$lib/design/primitives/inline-message/InlineMessage.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { inlineMessageRecipe } from "./recipe.js";

	let {
		tone = "info",
		children,
		class: className,
		...rest
	}: InlineMessageComponentProps = $props();

	const builder = createInlineMessage();

	const classes = $derived(cn(inlineMessageRecipe({ tone }), className));
</script>

<InlineMessageRoot {...builder.root} {...rest} class={classes} data-state={tone}>
	{@render children?.()}
</InlineMessageRoot>
