<!--
	@component Card.Action
	@kind card
	@slot action
	@layer components

	Header action area — buttons, links, menus placed alongside title.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getCardContext } from "./context.js";
import type { CardActionProps } from "./types.js";

let { children, element, class: className, ...rest }: CardActionProps = $props();
const ctx = getCardContext();

const attrs = $derived({
	id: ctx.ids.action,
	"data-kind": "card" as const,
	"data-slot": "action" as const,
	class: cn(ctx.classes.action, className),
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
