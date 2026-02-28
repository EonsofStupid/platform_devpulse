<script lang="ts">
	/**
	 * @file primitives/flex/Flex.svelte
	 * @kind flex
	 * @layer primitives
	 * @package @devpulse/coldlight
	 *
	 * Flexbox container. Zero ARIA. Zero styling.
	 */

	import type { FlexProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, as = "div", ...rest }: FlexProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Flex"); });
</script>

<svelte:element this={as} data-kind="flex" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</svelte:element>
