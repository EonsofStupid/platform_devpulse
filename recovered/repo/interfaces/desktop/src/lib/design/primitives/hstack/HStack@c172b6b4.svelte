<script lang="ts">
	import type { HStackProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: HStackProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "HStack"); });
</script>

<div data-kind="hstack" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
