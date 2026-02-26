<!--
	@component ToggleGroupRoot
	@file primitives/toggle-group/ToggleGroup.svelte
	@kind toggle-group
	@layer primitives
	@package @devpulse/coldlight

	Structureless toggle-group primitive — semantic HTML element with data attributes only.
	Contract: kind="toggle-group", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/toggle-group/ToggleGroup.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/toggle-group/contract.ts

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
-->
<script lang="ts">
	import type { ToggleGroupRootProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: ToggleGroupRootProps = $props();

	if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "ToggleGroup");
</script>

<div data-kind="toggle-group" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
