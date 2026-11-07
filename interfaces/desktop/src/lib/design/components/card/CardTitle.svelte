<!--
	@component Card.Title
	@kind card
	@slot title
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getCardContext } from "./context.js";
import type { CardTitleProps } from "./types.js";

let { level = "h3", children, element, class: className, ...rest }: CardTitleProps = $props();
const ctx = getCardContext();

const attrs = $derived({
	id: ctx.ids.title,
	"data-kind": "card" as const,
	"data-slot": "title" as const,
	class: cn(ctx.classes.title, className),
	...rest,
});
</script>

{#if element}
	{@render element(attrs)}
{:else}
	<svelte:element this={level} {...attrs}>
		{@render children?.()}
	</svelte:element>
{/if}
