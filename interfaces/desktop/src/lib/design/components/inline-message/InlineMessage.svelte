<!--
	@component InlineMessage
	@kind inline-message
	@layer components

	ColdLight InlineMessage — builder-driven, 8-axis visual system.
-->
<script lang="ts">
import { createInlineMessage } from "$lib/design/api/dsadapters/coldlight/_internal/inline-message/index.js";
import InlineMessageRoot from "$lib/design/primitives/inline-message/InlineMessage.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { inlineMessageRecipe } from "./recipe.js";
import type { InlineMessageProps } from "./types.js";

let {
	tone = "info",
	children,
	class: className,
	...rest
}: InlineMessageProps = $props();

const builder = createInlineMessage();

const classes = $derived(
	cn(inlineMessageRecipe({ tone }), className));
</script>

<InlineMessageRoot {...builder.root} {...rest} class={classes} data-state={tone}>
	{@render children?.()}
</InlineMessageRoot>
