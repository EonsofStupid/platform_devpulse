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

let { position = "top", children, class: className, ...rest }: CardCoverProps = $props();
const ctx = getCardContext();
</script>

<div
	data-kind="card"
	data-slot="cover"
	data-position={position}
	class={cn(ctx.classes.cover, "overflow-hidden", className)}
	{...rest}
>
	{@render children?.()}
</div>
