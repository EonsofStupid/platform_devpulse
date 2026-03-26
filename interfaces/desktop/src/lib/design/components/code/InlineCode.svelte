<!--
	@component InlineCode
	@kind code
	@layer components

	Simple <code> span for inline code. Token-styled via centralized composition.
	No Shiki — just a styled code element.
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/styles/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { InlineCodeProps } from "./types.js";

let {
	id,
	dir = "ltr",
	children,
	intent = "inline",
	class: className,
	...rest
}: InlineCodeProps = $props();

</script>

<StyleMacro kind="code" intent={intent}>
	<code
		{id}
		{dir}
		data-kind="code"
		data-slot="inline"
		class={cn(className)}
		{...rest}
	>{@render children?.()}</code>
</StyleMacro>
