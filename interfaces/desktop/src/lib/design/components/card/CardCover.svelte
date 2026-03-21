<!--
	@component Card.Cover
	@kind card
	@slot cover
	@layer components

	Media/image area. Consumer puts img, video, or any visual content inside.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getCardContext } from "./context.js";
import type { CardCoverProps } from "./types.js";

let { position = "top", children, element, class: className, ...rest }: CardCoverProps = $props();
const ctx = getCardContext();

const attrs = $derived({
	id: ctx.ids.cover,
	"data-kind": "card" as const,
	"data-slot": "cover" as const,
	"data-position": position,
	class: cn(ctx.classes.cover, "overflow-hidden", className),
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
