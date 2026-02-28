<script lang="ts">
	/**
	 * @file primitives/checkbox/Checkbox.svelte
	 * @kind checkbox
	 *
	 * Zero ARIA. Zero styling. Structural shell only.
	 * Component layer applies role="checkbox", aria-checked, etc.
	 */

	import type { CheckboxRootProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: CheckboxRootProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Checkbox"); });
</script>

<button type="button" data-kind="checkbox" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</button>
