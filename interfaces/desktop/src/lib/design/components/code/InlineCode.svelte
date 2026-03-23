<!--
	@component InlineCode
	@kind code
	@layer components

	Simple <code> span for inline code. Token-styled via centralized recipe.
	No Shiki — just a styled code element.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { InlineCodeProps } from "./types.js";

let {
	id,
	dir = "ltr",
	children,
	class: className,
	...rest
}: InlineCodeProps = $props();

</script>

<code
	{id}
	{dir}
	data-kind="code"
	data-slot="inline"
	class={cn(className)}
	{...rest}
>{@render children?.()}</code>
