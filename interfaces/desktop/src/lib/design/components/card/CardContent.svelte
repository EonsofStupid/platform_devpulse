<!--
	@component Card.Content
	@kind card
	@slot content
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getCardContext } from "./context.js";
import type { CardContentProps } from "./types.js";

let { children, element, class: className, ...rest }: CardContentProps = $props();
const ctx = getCardContext();

const attrs = $derived({
	id: ctx.ids.content,
	"data-kind": "card" as const,
	"data-slot": "content" as const,
	class: cn(ctx.classes.content, className),
	...rest,
});
</script>

{#if element}
	{@render element(attrs)}
{:else}
	<div {...attrs}>
		{@render children?.()}
	</div>
{/if}
