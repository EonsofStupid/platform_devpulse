<script lang="ts">
	import type { GridProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: GridProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Grid"); });
</script>

<div data-kind="grid" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
