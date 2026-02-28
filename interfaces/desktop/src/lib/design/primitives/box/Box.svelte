<script lang="ts">
	/**
	 * @file primitives/box/Box.svelte
	 * @kind box
	 * @layer primitives
	 * @package @devpulse/coldlight
	 *
	 * Base layout container. Polymorphic via `as` prop.
	 * Zero ARIA. Zero styling. data-kind + data-slot + spread.
	 */

	import type { BoxProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, as = "div", ...rest }: BoxProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Box"); });
</script>

<svelte:element this={as} data-kind="box" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</svelte:element>
