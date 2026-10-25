<!--
	@component Card.Footer
	@kind card
	@slot footer
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getCardContext } from "./context.js";
import type { CardFooterProps } from "./types.js";

let { children, element, class: className, ...rest }: CardFooterProps = $props();
const ctx = getCardContext();

const attrs = $derived({
	id: ctx.ids.footer,
	"data-kind": "card" as const,
	"data-slot": "footer" as const,
	class: cn(ctx.classes.footer, className),
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
