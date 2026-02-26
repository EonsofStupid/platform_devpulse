<!--
	@component NumberInputRoot
	@file primitives/number-input/NumberInput.svelte
	@kind number-input
	@layer primitives
	@package @devpulse/coldlight

	Structureless number-input primitive — semantic HTML element with data attributes only.
	Contract: kind="number-input", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/number-input/NumberInput.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/number-input/contract.ts

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
-->
<script lang="ts">
	import type { NumberInputRootProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: NumberInputRootProps = $props();

	if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "NumberInput");
</script>

<div data-kind="number-input" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
