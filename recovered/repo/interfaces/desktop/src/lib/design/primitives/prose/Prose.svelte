<!--
	@component Prose
	@file primitives/prose/Prose.svelte
	@kind prose
	@layer primitives
	@package @devpulse/coldlight

	Rich text content container primitive — semantic HTML element with data attributes only.
	Contract: kind="prose", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/prose/Prose.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/prose/contract.ts
-->
<script lang="ts">
	import type { ProseProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: ProseProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Prose"); });
</script>

<div data-kind="prose" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
