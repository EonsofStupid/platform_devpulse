<!--
	@component ContextualHelp.Heading
	@kind contextual-help
	@slot heading
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getContextualHelpContext } from "./context.js";
import type { ContextualHelpHeadingProps } from "./types.js";

let { children, class: className, ...rest }: ContextualHelpHeadingProps = $props();
const ctx = getContextualHelpContext();
</script>

<h3
	id={ctx.ids.heading}
	data-kind="contextual-help"
	data-slot="heading"
	class={cn(ctx.classes.heading, className)}
	{...rest}
>
	{@render children?.()}
</h3>
