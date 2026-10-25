<!--
	@component StepsRoot
	@file primitives/steps/Steps.svelte
	@kind steps
	@layer primitives
	@package @devpulse/coldlight

	Structureless steps primitive — semantic HTML element with data attributes only.
	Contract: kind="steps", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/steps/Steps.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/steps/contract.ts
-->
<script lang="ts">
	import type { StepsProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: StepsProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Steps.Root"); });
</script>

<nav
	data-kind="steps"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</nav>
