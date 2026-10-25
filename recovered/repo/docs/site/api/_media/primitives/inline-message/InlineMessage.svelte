<script lang="ts">
	import type { InlineMessageProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: InlineMessageProps = $props();

	if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "InlineMessage");
</script>

<div data-kind="inline-message" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
