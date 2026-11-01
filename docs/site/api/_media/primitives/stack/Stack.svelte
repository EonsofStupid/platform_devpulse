<script lang="ts">
	import type { StackProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: StackProps = $props();

	if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Stack");
</script>

<div data-kind="stack" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
