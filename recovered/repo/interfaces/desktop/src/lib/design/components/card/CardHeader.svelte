<!--
	@component Card.Header
	@kind card
	@slot header
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getCardContext } from "./context.js";
import type { CardHeaderProps } from "./types.js";

let { children, element, class: className, ...rest }: CardHeaderProps = $props();
const ctx = getCardContext();

const attrs = $derived({
	id: ctx.ids.header,
	"data-kind": "card" as const,
	"data-slot": "header" as const,
	class: cn(ctx.classes.header, className),
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
