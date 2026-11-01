<script lang="ts">
	import type { HeadingProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, level = 2, ...rest }: HeadingProps = $props();

	if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Heading");

	const tag = $derived(`h${level}` as const);
</script>

<svelte:element this={tag} data-kind="heading" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</svelte:element>
