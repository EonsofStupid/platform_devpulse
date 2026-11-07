<!--
	@component Card.Description
	@kind card
	@slot description
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getCardContext } from "./context.js";
import type { CardDescriptionProps } from "./types.js";

let { children, element, class: className, ...rest }: CardDescriptionProps = $props();
const ctx = getCardContext();

const attrs = $derived({
	id: ctx.ids.description,
	"data-kind": "card" as const,
	"data-slot": "description" as const,
	class: cn(ctx.classes.description, className),
	...rest,
});
</script>

{#if element}
	{@render element(attrs)}
{:else}
	<p {...attrs}>
		{@render children?.()}
	</p>
{/if}
