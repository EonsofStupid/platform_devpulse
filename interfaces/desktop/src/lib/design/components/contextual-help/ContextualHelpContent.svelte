<!--
	@component ContextualHelp.Content
	@kind contextual-help
	@slot content
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getContextualHelpContext } from "./context.js";
import type { ContextualHelpContentProps } from "./types.js";

let { children, class: className, ...rest }: ContextualHelpContentProps = $props();
const ctx = getContextualHelpContext();
</script>

<div
	data-kind="contextual-help"
	data-slot="content"
	class={cn(ctx.classes.content, className)}
	{...rest}
>
	{@render children?.()}
</div>
