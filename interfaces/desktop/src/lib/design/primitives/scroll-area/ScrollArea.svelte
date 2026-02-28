<script lang="ts">
	import type { ScrollAreaRootProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: ScrollAreaRootProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "ScrollArea"); });
</script>

<div data-kind="scroll-area" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
