<!--
	@component InlineCode
	@kind code
	@layer components

	Simple <code> span for inline code. Token-styled via centralized composition.
	No Shiki — just a styled code element.
-->
<script lang="ts">
import { resolveMacro, cssVarString } from "$lib/design/style-macro";
import { cn } from "$lib/design/utils/cn.js";
import type { InlineCodeProps } from "./types.js";

let {
	id,
	dir = "ltr",
	children,
	preset = "inline",
	class: className,
	...rest
}: InlineCodeProps = $props();

const m = $derived(resolveMacro({ kind: "code", preset }));
</script>

<code
	{id}
	{dir}
	{...m.dataAttrs}
	data-slot="inline"
	style={cssVarString(m.cssVars)}
	class={cn(className)}
	{...rest}
>{@render children?.()}</code>
