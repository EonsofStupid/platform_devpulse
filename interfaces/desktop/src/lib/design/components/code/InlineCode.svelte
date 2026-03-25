<!--
	@component InlineCode
	@kind code
	@layer components

	Simple <code> span for inline code. Token-styled via centralized composition.
	No Shiki — just a styled code element.
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/style/index.js";
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

const styleId = $derived(`code-${intent}`);
</script>

<StyleMacro kind="code" style={styleId}>
	<code
		{id}
		{dir}
		data-kind="code"
		data-slot="inline"
		class={cn(className)}
		{...rest}
	>{@render children?.()}</code>
</StyleMacro>
