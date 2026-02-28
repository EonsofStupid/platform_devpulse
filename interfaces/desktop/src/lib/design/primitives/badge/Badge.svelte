<script lang="ts">
	import type { BadgeProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: BadgeProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Badge"); });
</script>

<span data-kind="badge" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</span>
