<script lang="ts">
	import type { CardProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: CardProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Card"); });
</script>

<div data-kind="card" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
