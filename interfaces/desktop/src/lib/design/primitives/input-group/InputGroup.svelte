<!--
	@component InputGroupRoot
	@file primitives/input-group/InputGroup.svelte
	@kind input-group
	@layer primitives
	@package @devpulse/coldlight

	Structureless input-group primitive — semantic HTML element with data attributes only.
	Contract: kind="input-group", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/input-group/InputGroup.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/input-group/contract.ts
-->
<script lang="ts">
	import type { InputGroupProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: InputGroupProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "InputGroup"); });
</script>

<div data-kind="input-group" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
