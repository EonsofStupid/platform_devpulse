<script lang="ts">
	import type { TextProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, as = "span", ...rest }: TextProps = $props();

	if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Text");
</script>

<svelte:element this={as} data-kind="text" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</svelte:element>
